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
			let isLocal = await this.checkIsInLocal()
			let host = isLocal ? '192.168.2.9' : '7l235k7324.yicp.fun'
			uni.connectSocket({
				url: `ws://${host}:4000/socket-app/` + this.uid
			});
		},
 
		init() {
			console.log('尝试连接')
			this.connect()
			uni.onSocketOpen((res) => {
				console.log('WebSocket连接已打开！');
				clearTimeout(this.timer)
				this.connected = true
			});
			uni.onSocketError((res) => {
				this.connected = false
				console.log('WebSocket连接打开失败，请检查！');
				clearTimeout(this.timer)
				this.timer = setTimeout(() => {
					this.connect()
				}, 3000);
			});
			uni.onSocketClose((res) => {
				console.log('WebSocket 已关闭！');
				this.connect()
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
