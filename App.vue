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
		connect() {
			console.log(56, process.env.NODE_ENV)
			uni.connectSocket({
				url: 'ws://leirensheng.dynv6.net:4000/socket-app/' + this.uid
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
