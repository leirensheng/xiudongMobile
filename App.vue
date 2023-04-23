<script>
export default {
	onLaunch: function () {
		this.init()
	},
	data() {
		return {
			uid: 'uidabc',
			connected: false
		}
	},
	watch: {
		connected(val) {
			setTimeout(() => {
				console.log('emit')
				uni.$emit('connectedChange', val)
			}, 1000);
		}
	},
	methods: {
		checkIsInLocal() {
			return new Promise((resolve) => {
				uni.request({
					url: 'http://192.168.2.9:4000/ping',
					timeout: 200,
					success: () => {
						resolve(true)
					},
					fail: () => {
						resolve(false)
					},
				})
			})
		},
		async connect() {
			console.log('尝试连接')
			clearInterval(this.heartTimer)
			this.connected = false
			let isLocal = await this.checkIsInLocal()
			let host = isLocal ? '192.168.2.9' : '7l235k7324.yicp.fun'
			uni.connectSocket({
				url: `ws://${host}:4000/socket-app/` + this.uid
			});
		},

		startHeatBeat() {
			clearInterval(this.heartTimer)
			this.heartTimer = setInterval(() => {
				uni.sendSocketMessage({
					data: 'ping',
					success: res => {
						console.log('状态：已连接');
					},
					fail: err => {
						console.log('连接失败重新连接....');
						this.connect();
					}
				});
			}, 1000);
		},
		init() {
			this.connect()
			uni.onSocketOpen( (res)=> {
				console.log('WebSocket连接已打开！');
				this.connected = true
				this.startHeatBeat()
			});
			uni.onSocketError((res) => {
				this.connected = false
				console.log('WebSocket连接打开失败，请检查！');
				this.startHeatBeat()
			});
		}
	},
	onShow: function () {
		console.log('App Show')
	},
	onHide: function () {
		console.log('App Hide')
	}
}
</script>

<style>
/*每个页面公共css */
</style>
