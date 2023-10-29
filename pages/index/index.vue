<template>
	<view class="content" :style="style">
		<div class="status">
			<div>连接状态: </div>
			<div class="dot" :style="{ background: connected ? '#49e749' : 'red' }"> </div>
		</div>
		<div class="all-message">
			<div class="sum" v-if="msgArr.length">共有{{ msgArr.length }}条消息</div>
			<div class="message-wrap" :class="item.type" v-for="(item, index) in msgArr" :key="item.phone"
				@click="clickMsg(item, index)">
				<!-- <div class="index">{{index+1}}.</div> -->
				<div class="message" v-html="item.msg"></div>
				<!-- <div>{{ index + 1 }}: {{ item.msg }}</div> -->
			</div>
		</div>

		<div class="bottom">
			<button @click="clear" class="clear" type="primary" v-if="msgArr.length">清除</button>
			<button @click="stop" class="stop" v-if="innerAudioContext" type="success">停止</button>
		</div>

	</view>
</template>

<script>
export default {
	data() {
		return {
			connected: false,
			innerAudioContext: null,
			title: 'Hello',
			msgArr: []
		}
	},
	computed: {
		style() {
			return {
				// background: this.msgArr.some(one => one.msg.includes('成功')) ? 'green' : 'white'
			}
		},
	},
	onLoad() {
		uni.$on('connectedChange', val => {
			this.connected = val
		})
		uni.onSocketMessage((res) => {
			console.log('收到服务器内容：' + res.data);
			let { type, msg, phone } = JSON.parse(res.data)

			console.log(type)
			if (type === 'ticketSuccess') {
				this.msgArr.push({ msg, phone })
				this.playSong()
			} else if (type === 'tips') {
				this.msgArr.push({ msg, phone })
				this.playSong(true)
			}

		});
		// #ifdef APP-PLUS
		var info = plus.push.getClientInfo()
		// 使用5+App的方式进行监听消息推送
		plus.push.addEventListener("click", ({ payload }) => {
			// console.log("click:" + JSON.stringify(msg));
			uni.showToast({
				title: 'click' + JSON.stringify(payload),
				icon: "none",
				duration: 3500,
			})
			this.msgArr.push(payload)
		}, false);
		// 监听在线消息事件    
		plus.push.addEventListener("receive", ({ payload }) => {
			this.msgArr.push(payload)
			uni.showToast({
				title: 'receive' + JSON.stringify(payload),
				icon: "none",
				duration: 3500,
			})

		}, false);
		// #endif
	},
	watch: {
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

		clickMsg(item, index) {
			if (item.phone) {
				this.call(item.phone, index)
			}
		},
		playSong(isTips) {
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
		clear() {
			this.msgArr = []
		},
		call(phoneNumber, i) {
			uni.showActionSheet({
				itemList: [phoneNumber, '呼叫'],
				success: (res) => {
					if ([0, 1].includes(res.tapIndex)) {
						this.msgArr.splice(i, 1)
						uni.makePhoneCall({
							phoneNumber,
						})
					}
				}
			})
		},

		stop() {
			this.innerAudioContext.destroy()
			this.innerAudioContext = null
		},
		sendMsg(msg) {
			uni.sendSocketMessage({
				data: msg
			});

		}
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

		&.error {
			color: red;
		}

		&.info {
			color: black;
		}

		.message {
			width: 100%;
			word-break: break-all;
			border-bottom: 2px solid rgb(233, 239, 233);
			padding-bottom: 15px;
			margin-bottom: 15px;
		}
	}
}

.bottom {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 20px;
	padding-bottom: 20px;
}</style>
