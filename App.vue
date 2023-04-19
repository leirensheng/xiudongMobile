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
		getWifiName() {
			uni.getNetworkType({
				success: function (res) {
					console.log(res.networkType);
					if (res.networkType != "wifi") {
						uni.showToast({
							icon: 'none', duration: 2000,
							title: "未连接WIFI",
						})
					} else {
						//判断获取的WiFi是否为机型WiFi
						// 主窗体  
						var MainActivity = plus.android.runtimeMainActivity()
						// 上下文  
						var Context = plus.android.importClass('android.content.Context')
						// 导入WIFI管理 和 WIFI 信息 的class  
						plus.android.importClass("android.net.wifi.WifiManager")
						plus.android.importClass("android.net.wifi.WifiInfo")
						plus.android.importClass("android.net.wifi.ScanResult")
						plus.android.importClass("java.util.ArrayList")
						// 获取 WIFI 管理实例  
						var wifiManager = MainActivity.getSystemService(Context.WIFI_SERVICE)

						// 获取当前连接WIFI的信息  
						var info = wifiManager.getConnectionInfo()

						// 获取当前 WIFI 连接的 SSID (WIFI 名称)  
						var ssid = info.getSSID()
						// 这里的 获取到的名称 是 带 双引号的 如 "cmcc"    
						// 所以我们这里处理一下  
						// ssid = ssid.replace(/(^\"*)|(\"*$)/g, "")
						console.log("info", ssid)

					}
				}
			})
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
