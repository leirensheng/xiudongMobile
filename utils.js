let urlToRequest = {};
let request = (options) =>
  new Promise((resolve, reject) => {
    let path = options.url.split("/").pop();
    let pre = urlToRequest[path];
    if (pre && options.cancelPre) {
      pre.abort();
    }
    urlToRequest[path] = uni.request({
      ...options,
      timeout: options.timeout || 20000,
      success: (res) => {
        console.log(res);
        let result = res.data;
        let { code, data, msg } = result;
        if (options.noHandleCode) {
          resolve(result);
          return;
        }
        let tips = msg;
        if (code !== 0) {
          tips = msg || "出错";
        }
        if (tips) {
          uni.showToast({
            title: tips,
            icon: "none",
            duration: 3500,
          });
        }
        if (code !== 0) {
          reject();
        } else {
          resolve(data);
        }
      },
      fail: (e) => {
        reject(e);
      },
      complete: () => {
        urlToRequest[path] = null;
      },
    });
  });

let random = (min, max) => Math.floor(Math.random() * (max - min)) + min;
let tagList = [];

let randomColor = () => {
  return `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
};


let getTagColor = (tag) => {
  if (!tagList[tag]) {
    tagList[tag] = randomColor()
    // localStorage.tagList = JSON.stringify(tagList);
  }
  return tagList[tag];
};

let formatNumber = (val) => (val < 10 ? "0" + val : val);
let getTime = (date) => {
  if (!date) {
    date = new Date();
  }
  let year = date.getFullYear();

  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();

  return `${year}-${formatNumber(month)}-${formatNumber(day)} ${formatNumber(
    hour
  )}:${formatNumber(minute)}:${formatNumber(second)}`;
};
let sleep = (time) => new Promise((r) => setTimeout(r, time));

export { request, getTagColor, getTime, sleep,randomColor };
