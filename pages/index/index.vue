<template>
	<view class="content" :style="style">
		<div class="status">
			<div>连接状态: </div>
			<div class="dot" :style="{ background: connected ? '#49e749' : 'red' }"> </div>
		</div>
		<div class="all-message">
			<div class="message" v-for="(item, index) in msgArr" :key="item.phone" @click="call(item.phone, index)">
				<div>{{ item.msg }}</div>
			</div>
		</div>

		<button @click="clear" class="stop">清除</button>

		<button @click="stop" class="stop" v-if="innerAudioContext">停止</button>
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
			this.msgArr.push({ msg, phone })
			console.log(type)
			if (type === 'ticketSuccess') {
				this.playSong()
			}

		});
	},
	methods: {
		playSong() {
			this.innerAudioContext = uni.createInnerAudioContext();
			this.innerAudioContext.autoplay = true;
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
				itemList: [phone, '呼叫'],
				success: function (res) {
					console.log(res);
					if (res.tapIndex == 1) {
						uni.makePhoneCall({
							phoneNumber,
						})
					}
				}
			})
			this.msgArr.splice(i, 1)
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
}

.status {
	display: flex;
	align-items: center;

	.dot {
		margin-left: 15px;
		width: 15px;
		height: 15px;
		border-radius: 50%;
	}
}

.all-message {
	.message {
		margin: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
}

.stop {
	margin-top: 20px;
}
</style>
