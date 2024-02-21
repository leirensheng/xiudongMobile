<template>
	<view>
		<view
			:class="['date', type]"
			:style="{borderColor, opacity: disabled ? 0.6 : 1, height}"
			@tap="tapInput">
			<slot name="icon">
				<view v-if="showIcon" class="calendar" :style="{borderColor: iconColor}">
					<view class="calendar-top calendar-top-left" :style="{background: iconColor}" />
					<view class="calendar-top calendar-top-right" :style="{background: iconColor}" />
					<view class="calendar-line" :style="{background: iconColor}" />
					<view class="calendar-line calendar-line-bottom" :style="{background: iconColor}" />
				</view>
			</slot>
			<text
				class="date-text"
				:style="{color: date ? color : placeholderColor, fontSize, textAlign}">
				{{ date || placeholder }}
			</text>
			<slot name="arrow">
				<view
					v-if="showArrow && (!showClear || showClear && !date)"
					class="arrow-icon"
					:style="{boxShadow: `-4rpx 4rpx 0 0rpx ${arrowColor} inset`}" />
			</slot>
			<view v-if="showClear && date" class="ir-clear" @click.stop="clear">
				<slot name="clear">
					<view class="ir-clear-icon" :style="{background: clearColor}">
						<view class="clear-line" :style="{background: clearColor}" />
					</view>
				</slot>
			</view>
		</view>
		
		<view v-if="visible" class="ir-mask" @tap="visible = false"></view>
		
		<view v-if="visible" class="picker-con" :style="{background: pickerBg}">
			<view class="flex">
				<view @tap="visible = false">
					<slot name="cancel">
						<view class="ir-btn" :style="{color: cancelColor}">取消</view>
					</slot>
				</view>
				<view @tap="confirm">
					<slot name="confirm">
						<view class="ir-btn" :style="{color: confirmColor}">确认</view>
					</slot>
				</view>
			</view>
			<picker-view
				class="picker-view"
				:indicator-style='indicatorStyle'
				:mask-style='maskStyle'
				:value="pickerVal"
				indicator-class="ir-datetime-picker"
				mask-class='ir-datetime-picker-mask'
				@change="bindChange"
				@touchmove="touchmove"
				@touchend="touchend">
				<picker-view-column>
					<view class="item"
						v-for="(item,index) in years"
						:style="[{color: index === pickerVal[0] ? activeColor : pickerColor}, itemStyle]"
						:key="index">{{item}}年</view>
				</picker-view-column>
				<picker-view-column>
					<view class="item"
						v-for="(item,index) in months"
						:style="[{color: index === pickerVal[1] ? activeColor : pickerColor}, itemStyle]"
						:key="index">{{item}}月</view>
				</picker-view-column>
				<picker-view-column>
					<view class="item"
						v-for="(item,index) in days" 
						:key="index"
						:style="[{color: index === pickerVal[2] ? activeColor : pickerColor}, itemStyle]">{{item}}日</view>
				</picker-view-column>
				<picker-view-column>
					<view class="item"
						v-for="(item,index) in hours"
						:key="index"
						:style="[{color: index === pickerVal[3] ? activeColor : pickerColor}, itemStyle]">{{item}}时</view>
				</picker-view-column>
				<picker-view-column>
					<view class="item"
						v-for="(item,index) in minutes"
						:key="index"
						:style="[{color: index === pickerVal[4] ? activeColor : pickerColor}, itemStyle]">{{item}}分</view>
				</picker-view-column>
			</picker-view>
			<view v-if="showCover" class="cover"></view>
		</view>
	</view>
</template>

<script>
	export default {
		name: "IrDateTimePicker",
		props: {
			start: {
				type: [String, Number],
				default: '2010/01/01 00:00'
			},
			end: {
				type: [String, Number],
				default: '2050/12/31 23:59'
			},
			value: {
				type: [String, Number],
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			type: {
				type: String,
				default: 'border'
			},
			height: {
				type: String,
				default: '66rpx'
			},
			fontSize: {
				type: String,
				default: ''
			},
			color: {
				type: String,
				default: '#333'
			},
			textAlign: {
				type: String,
				default: 'left',
			},
			borderColor: {
				type: String,
				default: '#ddd'
			},
			showIcon: {
				type: Boolean,
				default: false
			},
			iconColor: {
				type: String,
				default: '#555'
			},
			showArrow: {
				type: Boolean,
				default: false
			},
			arrowColor: {
				type: String,
				default: '#999'
			},
			showClear: {
				type: Boolean,
				default: false
			},
			clearColor: {
				type: String,
				default: '#999'
			},
			placeholder: {
				type: String,
				default: '请选择日期时间'
			},
			placeholderColor: {
				type: String,
				default: '#999'
			},
			pickerBg: {
				type: String,
				default: '#fff',
			},
			cancelColor: {
				type: String,
				default: '#666'
			},
			confirmColor: {
				type: String,
				default: '#007AFF'
			},
			maskStyle: {
				type: String,
				default: ''
			},
			indicatorStyle: {
				type: String,
				default: 'height: 50px;'
			},
			pickerColor: {
				type: String,
				default: ''
			},
			activeColor: {
				type: String,
				default: '',
			},
			returnType: {
				type: String,
				default: 'string',
			}
		},
		data() {
			const baseArr = ['', '']
			return {
				date: '',
				years: baseArr,
				months: baseArr,
				days: baseArr,
				hours: baseArr,
				minutes: baseArr,
				days28: [],
				pickerVal: [],
				visible: false,
				itemStyle: null,
				startObj: {
					months: [],
					days: []
				},
				endObj: {
					months: [],
					days: []
				},
				changeDisabled: false,
				moveFlag: false,
				showCover: false,
				hasChange: false
			}
		},
		watch: {
			start() {
				this.setStartEnd()
				const date = this.value ? this.value : new Date()
				this.initCurr(date)
			},
			end() {
				this.setStartEnd()
				const date = this.value ? this.value : new Date()
				this.initCurr(date)
			},
			value(val) {
				const date = val ? val : new Date()
				this.initCurr(date)
				
				const {y, m, d, h, minu} = this.trimDate(this.value)
				const trimN = this.trimNum
				this.date = `${y}-${trimN(m)}-${trimN(d)} ${trimN(h)}:${trimN(minu)}`
			}
		},
		created() {
			this.days28 = this.setArray(1, 28)
			if (this.activeColor || this.pickerColor) {
				this.itemStyle = {
					height: '50px',
					lineHeight: '50px'
				}
			}
			
			this.setStartEnd()
			if (this.value) {
				const {y, m, d, h, minu} = this.trimDate(this.value)
				const trimN = this.trimNum
				this.date = `${y}-${trimN(m)}-${trimN(d)} ${trimN(h)}:${trimN(minu)}`
			}
			const date = this.value ? this.value : new Date()
			this.initCurr(date)
		},
		methods: {
			// 点击显示框
			tapInput() {
				if (!this.disabled) {
					this.visible = !this.visible
					// #ifdef MP-BAIDU
					if (this.visible) {
						const val = this.pickerVal
						this.pickerVal = [-5, -5, -5, -5, -5]
						setTimeout(_ => {
							this.pickerVal = val
						})
					}
					// #endif
				}
			},
			// 设置一个是否是touchmove的flag
			touchmove() {
				this.moveFlag = true
			},
			touchend() {
				// touchend时，如果有move，则显示遮罩，以防多次滑动
				if (this.moveFlag) {
					this.showCover = true
					this.moveFlag = false
				}
				// move没有触发change事件，则隐藏遮罩
				setTimeout(_ => {
					if (!this.hasChange) {
						this.showCover = false
					}
				}, 200)
			},
			// 当滚动选择
			bindChange: function (e) {
				if (this.changeDisabled) return
				
				this.changeDisabled = true
				const prev = this.pickerVal
				const val = e.detail.value
				const y = this.years[val[0]] ? this.years[val[0]] : this.years[this.years.length - 1]
				const m = this.months[val[1]] ? this.months[val[1]] : this.months[this.months.length - 1]
				const d = this.days[val[2]] ? this.days[val[2]] : this.days[this.days.length - 1]
				const h = this.hours[val[3]] >= 0 ? this.hours[val[3]] : this.hours[this.hours.length - 1]
				const minu = this.minutes[val[4]] >= 0 ? this.minutes[val[4]] : this.minutes[this.minutes.length - 1]
				
				const date = `${y}/${m}/${d} ${h}:${minu}`
				if (prev[1] != val[1]) {
					this.initCurr(date, m, d)
				} else {
					this.initCurr(date)
				}
				this.pickerVal = val
			},
			// 点击确定
			confirm() {
				const val = this.pickerVal
				const trimN = this.trimNum
				const d = `${this.years[val[0]]}-${trimN(this.months[val[1]])}-${trimN(this.days[val[2]])}`
				const t = `${trimN(this.hours[val[3]])}:${trimN(this.minutes[val[4]])}`
				const date = `${d} ${t}`
				this.date = date
				let rV = date
				if (this.returnType === "timestamp") {
					rV = new Date(date).getTime()
				} else if (this.returnType === "date") {
					rV = new Date(date)
				}
				this.$emit('change', rV)
				this.$emit('update:value', rV)
				this.visible = false
			},
			clear() {
				this.date = ''
				this.$emit('change', '')
			},
			// 根据年月,设置日期(不同月份，日期不同)
			setDays(year, month, start) {
				let newDays = []
				const monthReg = /^4|6|9|11$/
				let days = this.days28
				if (start) {
					days = this.setArray(start, 28)
				}
				if (monthReg.test(month)) {
					newDays = [...days, 29, 30]
				} else if (month === 2) {
					if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0) {
						newDays = [...days, 29]
					} else {
						newDays = days
					}
				} else {
					newDays = [...days, 29, 30, 31]
				}
				return newDays
			},
			// 设置最大最小月日时分
			setStartEnd() {
				const {sy, ey, sm, em, sd, ed, sh, eh, sminu, eminu} = this.getSE()
				
				this.years = this.setArray(sy, ey)
				// 设置最大最小月
				if (sy === ey) {
					this.startObj.months = this.endObj.months = this.setArray(sm, em)
				} else {
					this.startObj.months = this.setArray(sm, 12)
					this.endObj.months = this.setArray(1, em)
				}
				
				// 设置最大最小日
				if (sy === ey && sm === em) {
					this.startObj.days = this.endObj.days = this.setArray(sd, ed)
				} else {
					this.startObj.days = this.setDays(sy, sm, sd)
					this.endObj.days = this.setArray(1, ed)
				}
				
				// 设置最大最小时
				if (sy === ey && sm === em && sd === ed) {
					this.startObj.hours = this.endObj.hours = this.setArray(sh, eh)
				} else {
					this.startObj.hours = this.setArray(sh, 23)
					this.endObj.hours = this.setArray(0, eh)
				}
				
				// 设置最大最小分钟
				if (sy === ey && sm === em && sd === ed && sh === eh) {
					this.startObj.minutes = this.endObj.minutes = this.setArray(sminu, eminu)
				} else {
					this.startObj.minutes = this.setArray(sminu, 59)
					this.endObj.minutes = this.setArray(0, eminu)
				}
			},
			// 初始化选中项
			initCurr(val, month, day) {
				// console.log(val)
				this.hasChange = true
				const {start, end, sy, ey, sm, em, sd, ed, sh, eh, sminu, eminu} = this.getSE()
				const {val: curr, y: cy, m: cm, d: cd, h: ch, minu: cminu} = this.trimDate(val, month, day)
				
				let cyi = this.years.indexOf(cy)
				let cmi = 0
				let cdi = 0
				let chi = 0
				let cminui = 0
				
				let endSIFlag = true	// 是否在最后统一设置index
				
				if (curr.getTime() >= end.getTime()) {	//  值大于等于结束时间
					// console.log(11)
					this.months = this.endObj.months
					this.days = this.endObj.days
					this.hours = this.endObj.hours
					this.minutes = this.endObj.minutes
					cyi = this.years.length - 1
					cmi = this.months.length - 1
					cdi = this.days.length - 1
					chi = this.hours.length - 1
					cminui = this.minutes.length - 1
					endSIFlag = false
				} else if (curr.getTime() <= start.getTime()) {	// 值小于等于开始时间
					// console.log(22)
					this.months = this.startObj.months
					this.days = this.startObj.days
					this.hours = this.startObj.hours
					this.minutes = this.startObj.minutes
					cyi = cmi = cdi = chi = cminui = 0
					endSIFlag = false
				} else if (cy === ey && cm === em && cd === ed && ch === eh) {
					// 值与结束时间年/月/日/时相同
					// console.log(222)
					this.months = this.endObj.months
					this.days = this.endObj.days
					this.hours = this.endObj.hours
					this.minutes = this.endObj.minutes
				} else if (cy === ey && cm === em && cd === ed) {
					// 值与结束时间年/月/日相同
					// console.log(111)
					this.months = this.endObj.months
					this.days = this.endObj.days
					this.hours = this.endObj.hours
					// console.log(this.hours)
					this.minutes = this.setArray(0, 59)
				} else if (cy === ey && cm === em) {	// 值与结束时间年、月相同
					// console.log(33)
					this.months = this.endObj.months
					this.days = this.endObj.days
					this.hours = this.setArray(0, 23)
					this.minutes = this.setArray(0, 59)
				} else if (cy === ey) {	// 值与结束时间年份相同
					// console.log(44)
					this.months = this.endObj.months
					this.days = this.setDays(cy, cm)
					this.hours = this.setArray(0, 23)
					this.minutes = this.setArray(0, 59)
				} else if (cy === sy && cm === sm && cd === sd && ch === sh) {
					// 值与开始时间年/月/日/时相同
					// console.log(99)
					this.months = this.startObj.months
					this.days = this.startObj.days
					this.hours = this.startObj.hours
					this.minutes = this.startObj.minutes
				} else if (cy === sy && cm === sm && cd === sd) {
					// 值与开始时间年/月/日相同
					// console.log(88)
					this.months = this.startObj.months
					this.days = this.startObj.days
					this.hours = this.startObj.hours
					this.minutes = this.setArray(0, 59)
				} else if (cy === sy && cm === sm) {	// 值与开始时间年、月相同
					// console.log(55)
					this.months = this.startObj.months
					this.days = this.startObj.days
					this.hours = this.setArray(0, 23)
					this.minutes = this.setArray(0, 59)
				} else if (cy === sy) {	// 值与开始时间年份相同
					// console.log(66)
					this.months = this.startObj.months
					this.days = this.setDays(cy, cm)
					this.hours = this.setArray(0, 23)
					this.minutes = this.setArray(0, 59)
				} else {	// 值与开始时间、结束时间不同年月
					// console.log(77)
					this.months = this.setArray(1, 12)
					this.days = this.setDays(cy, cm)
					this.hours = this.setArray(0, 23)
					this.minutes = this.setArray(0, 59)
				}
				
				if (endSIFlag) {
					const di = this.days.indexOf(cd)
					
					cmi = this.months.indexOf(cm)
					cdi = di === -1 ? this.days.length - 1 : di
					chi = this.hours.indexOf(ch)
					cminui = this.minutes.indexOf(cminu)
				}
				
				this.$nextTick(_ => {
					this.pickerVal = [cyi, cmi, cdi, chi, cminui]
					this.changeDisabled = false
					this.showCover = false
					this.hasChange = false
				})
			},
			// 设置开始/结束时间相关变量
			getSE() {
				let s = this.start
				let e = this.end
				s = s ? s : '2010/01/01 00:00'
				e = e ? e : '2050/12/31 23:59'
				
				const {val: start, y: sy, m: sm, d: sd, h: sh, minu: sminu} = this.trimDate(s)
				const {val: end, y: ey, m: em, d: ed, h: eh, minu: eminu} = this.trimDate(e)
				return {
					start, sy, sm, sd, sh, sminu,
					end, ey, em, ed, eh, eminu
				}
			},
			// 返回时间信息
			trimDate(val, month, day) {
				const reg = /^\d{4}-\d{1,2}-\d{1,2}( \d{1,2}:\d{1,2})?(:\d{1,2})?$/
				if (typeof val === 'string' && reg.test(val)) {
					val = val.replace(/-/g, '/')
				}
				const curr = new Date(val)
				
				return {
					val: curr,
					y: curr.getFullYear(),
					m: month ? month : curr.getMonth() + 1,
					d: day ? day : curr.getDate(),
					h: curr.getHours(),
					minu: curr.getMinutes()
				}
			},
			// 获取一个范围内的整数，返回数组
			setArray(start, end) {
				const arr = []
				for (let i = start; i <= end; i ++) {
					arr.push(i)
				}
				return arr
			},
			// 将数字转换成两位
			trimNum(num) {
				num = num >= 10 ? num : `0${num}`
				return num
			}
		}
	}
</script>

<style scoped>
.date {
	padding: 16rpx;
	display: flex;
	align-items: center;
	box-sizing: border-box;
}
.date-text {
	flex: 1;
}
.border {
	border: 1rpx solid;
	border-radius: 6rpx;
}
.border-bottom {
	border-bottom: 1rpx solid;
}
.calendar {
	width: 30rpx;
	height: 30rpx;
	border: 1rpx solid;
	border-radius: 4rpx;
	margin-right: 16rpx;
	margin-top: 6rpx;
	position:relative;
}
.calendar .calendar-line {
	width: 26rpx;
	height: 4rpx;
	position:absolute;
	left: 2rpx;
	top: 10rpx;
	opacity: 0.6;
	z-index:1;
}
.calendar .calendar-line-bottom {top: 20rpx}
.calendar .calendar-top {
	position:absolute;
	top:-6rpx;
	width: 4rpx;
	height: 12rpx;
	z-index:2;
	border-radius: 2rpx;  
}
.calendar .calendar-top-left {left:6rpx;}
.calendar .calendar-top-right {right:6rpx;}
.arrow-icon {
	width: 26rpx;
	height: 26rpx;
	transform: rotate(45deg);
	margin-left: 20rpx;
}
.ir-clear {
	min-width: 40rpx;
	min-height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.ir-clear-icon {
	position:relative;
	width: 30rpx;
	height: 4rpx;
	transform:rotate(45deg);
	border-radius: 4em;
}

.ir-clear-icon .clear-line {
	position:absolute;
	width: 30rpx;
	height: 4rpx;
	transform:rotate(90deg);
	border-radius: 4em;
}
.ir-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background-color: rgba(0,0,0,.1);
}
.picker-con {
	width: 750rpx;
	border-top-right-radius: 30rpx;
	border-top-left-radius: 30rpx;
	overflow: hidden;
	box-shadow: 0 0 20rpx 0 rgba(0,0,0,.4);
	position: absolute;
	bottom: 0;
	left: 0;
	background-color: #fff;
	z-index: 999;
}
.flex {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
}
.ir-btn {
	width: 120rpx;
	padding: 26rpx 20rpx;
	text-align: center;
}
.picker-view {
	width: 750rpx;
	height: 500rpx;
}
.picker-view .item {
	line-height: 50px;
	align-items: center;
	justify-content: center;
	text-align: center;
}
.cover {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}
</style>
