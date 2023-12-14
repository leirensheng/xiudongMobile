<template>
	<view class="content" :style="style">
		<!-- <div class="status">
			<div>连接状态: </div>
			<div class="dot" :style="{ background: connected ? '#49e749' : 'red' }"> </div>
		</div> -->
		<div class="status">
			<div style="margin-right: 10px;">勿扰: </div>
			<switch :checked="isNoSound" @change="handleNOSoundChange" />

			<div style="margin-right: 10px;">仅成功: </div>
			<switch :checked="isOnlySuccess" @change="handleOnlySuccessChange" />
			<my-input class="keyword" type="text" v-model="keyword" placeholder="筛选" />
		</div>

		<div class="all-message">
			<div class="sum" v-if="msgArr.length">共有{{ msgArr.length }}条消息<span v-if="successLength">，{{ successLength
			}}条成功</span></div>

			<uni-swipe-action>
				<template v-for="(item, index) in showArr" :key="index+item.msg">
					<uni-swipe-action-item :right-options="activityRightOptions" @click="activityClick($event, item)">
						<div class="message-wrap" :class="item.type" @click="clickMsg(item, index)">
							<!-- <div class="index">{{index+1}}.</div> -->
							<div class="message" v-html="item.msg"></div>
							<!-- <div>{{ index + 1 }}: {{ item.msg }}</div> -->
						</div>
					</uni-swipe-action-item>
				</template>
			</uni-swipe-action>
		</div>

		<div class="bottom">
			<button @click="clear" class="clear" type="primary" v-if="msgArr.length">清除</button>
			<button @click="stop" class="stop" v-if="innerAudioContext" type="success">停止</button>
		</div>

	</view>
</template>

<script>
import { request } from '@/utils.js'
export default {
	data() {
		return {
			isNoSound: !!uni.getStorageSync('isNoSound'),
			isOnlySuccess: !!uni.getStorageSync('isNoSound'),

			activityRightOptions: [
				{
					text: '删除',
					style: {
						backgroundColor: '#dd524d'
					}

				}
			],
			loading: false,
			connected: false,
			keyword: '',
			innerAudioContext: null,
			title: 'Hello',
			msgArr: []
		}
	},
	computed: {
		successLength() {
			return this.msgArr.filter(one => one.msg.includes('成功')).length
		},
		showArr() {
			let arr = this.isOnlySuccess ? this.msgArr.filter(one => one.msg.includes('成功')) : this.msgArr
			return arr.filter(one => one.msg.includes(this.keyword))
		},
	},
	onLoad() {
		this.loadAllMsg()

		// #ifdef APP-PLUS
		// 监听在线消息事件    
		plus.push.addEventListener("receive", ({ title, content, payload }) => {
			let routes = getCurrentPages();
			let curRoute = routes[routes.length - 1].route
			if (curRoute !== 'pages/index/index') {
				uni.showToast({
					icon: "none",
					title: JSON.stringify(payload),
					duration: 2000,
				})
			}
			let hasAdd = this.msgArr.find(one => one.id === payload.id)
			if (hasAdd) return
			this.msgArr.unshift(payload)

			if (payload.type === 'success') {
				this.playSong()
			} else if (!this.isNoSound) {
				this.sound(payload.type, payload.msg)
			}
		}, false);
		// #endif
	},
	watch: {
		loading(val) {
			if (val) {
				uni.showLoading({
					title: '加载中'
				});
			} else {
				uni.hideLoading();
			}
		},
		msgArr: {
			deep: true,
			handler(val) {
				if (!val.length) {
					this.stop()
				}
			}
		}
	},

	methods: {
		handleNOSoundChange(e) {
			this.isNoSound = e.detail.value
			if (this.isNoSound) {
				uni.setStorageSync('isNoSound', '1')
			} else {
				uni.removeStorageSync('isNoSound')
			}
		},
		handleOnlySuccessChange(e) {
			this.isOnlySuccess = e.detail.value
			if (this.isOnlySuccess) {
				uni.setStorageSync('isOnlySuccess', '1')
			} else {
				uni.removeStorageSync('isOnlySuccess')
			}
		},
		sound(type, msg) {
			let src = ''
			if (type === 'error') {
				src = '/static/wrong.wav'
			} else if (msg.includes('有票')) {
				src = '/static/hasTicket.mp3'
			} else {
				src = '/static/info.wav'
			}

			let innerAudioContext = uni.createInnerAudioContext();
			innerAudioContext.autoplay = true;
			innerAudioContext.loop = false
			innerAudioContext.src = src
		},
		async activityClick({ index }, { id }) {
			if (index === 0) {
				this.loading = true
				let host = `http://mticket.ddns.net:4000/removeAppMsg`
				await request({
					method: 'post', url: host,
					data: {
						id
					}
				});
				let i = this.msgArr.findIndex(one => one.id === id)
				this.msgArr.splice(i, 1)
				this.loading = false
			}
		},

		async loadAllMsg() {
			let host = `http://mticket.ddns.net:4000/getAllAppMsg`
			this.msgArr = await request({
				method: 'get', url: host
			});
		},
		clickMsg(item, index) {
			if (item.phone) {
				this.call(item.phone, item)
			}
		},
		startVibrate() {
			this.timer = setInterval(() => {
				uni.vibrateLong()
			}, 2000)
		},
		playSong(isTips) {
			//#ifdef APP-PLUS
			this.startVibrate()
			//#endif 

			this.innerAudioContext = uni.createInnerAudioContext();
			this.innerAudioContext.autoplay = true;
			this.innerAudioContext.loop = true
			this.innerAudioContext.src = isTips ? '/static/tips.mp3' : '/static/1.mp3';   //铃声文件的路径
			this.innerAudioContext.onPlay(() => {
				console.log('开始播放');
			});
			this.innerAudioContext.onError((res) => {
				console.log(res.errMsg);
				console.log(res.errCode);
				this.innerAudioContext = null
			});
		},
		async clear() {
			this.loading = true
			this.msgArr = []
			let host = `http://mticket.ddns.net:4000/removeAllAppMsg`
			await request({
				method: 'get', url: host
			});
			this.loading = false
		},
		call(phoneNumber, item) {
			let itemList = [phoneNumber, '呼叫', "复制", "已读"]
			if (item.payCode) {
				itemList.push('复制口令')
			}
			uni.showActionSheet({
				itemList,
				success: (res) => {
					if ([0, 1].includes(res.tapIndex)) {
						item.type = 'success-call'
						uni.makePhoneCall({
							phoneNumber,
						})
					} else if (res.tapIndex === 2) {
						uni.setClipboardData({
							data: phoneNumber,
						});
					} else if (res.tapIndex === 3) {
						item.type = 'success-call'
					} else {
						uni.setClipboardData({
							data: item.payCode,
						});
					}
				}
			})
		},

		stop() {
			this.innerAudioContext.destroy()
			this.innerAudioContext = null
			clearInterval(this.timer)
		},

	}
}
</script>

<style lang="scss" scoped>
.content {
	height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	// padding: 15px;
}

.status {
	display: flex;
	align-items: center;
	padding-top: 20px;

	.dot {
		margin-left: 15px;
		width: 15px;
		height: 15px;
		border-radius: 50%;
	}

	.keyword {
		width: 20vw;
	}
}

.all-message {
	margin: 20px;
	flex: 1;
	overflow: auto;
	width: 100%;

	.sum {
		text-align: center;
	}

	.message-wrap {
		padding: 10px;
		margin: 10px;
		display: flex;
		justify-content: center;
		align-items: center;

		&.success {
			color: green;
		}

		&.success-call {
			color: rgb(164, 207, 164);
		}

		&.pay {
			color: rgb(218, 126, 39);
		}


		&.error {
			color: red;
		}

		&.info {
			color: black;
		}

		.message {
			width: 100%;
			word-break: break-all;
			// border-bottom: 2px solid rgb(233, 239, 233);
			// padding-bottom: 15px;
		}
	}
}

.bottom {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 20px;
	padding-bottom: 20px;
}
</style>
