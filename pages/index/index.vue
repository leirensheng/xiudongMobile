<template>
	<view class="content" :style="style">
		<div class="status">
			<div>连接状态: </div>
			<div class="dot" :style="{ background: connected ? '#49e749' : 'red' }"> </div>
		</div>
		<div class="all-message">
			<div class="sum" v-if="msgArr.length">共有{{ msgArr.length }}条消息</div>
			<div class="message" v-for="(item, index) in msgArr" :key="item.phone" @click="call(item.phone, index)">
				<div>{{ index + 1 }}: {{ item.msg }}</div>
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
			}

		});
	},
	methods: {
		playSong() {
			this.innerAudioContext = uni.createInnerAudioContext();
			this.innerAudioContext.autoplay = true;
			this.innerAudioContext.loop = true
			this.innerAudioContext.src = '/static/1.mp3';   //铃声文件的路径
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
				success:  (res)=> {
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

	.sum {
		text-align: center;
	}

	.message {
		padding: 10px;
		margin: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
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
