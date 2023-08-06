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
        let { code, data, msg }  = result
        if(options.noHandleCode){
          resolve(result)
          return
        }
        let tips = msg;
        if (code !== 0) {
          tips = msg || "出错";
        }
        if (tips) {
          uni.showToast({
            title: tips,
            icon: "error",
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
let tagList = []

let getTagColor = (tag) => {
  if (!tagList[tag]) {
    tagList[tag] = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(
      0,
      255
    )})`;
    // localStorage.tagList = JSON.stringify(tagList);
  }
  return tagList[tag];
};

export { request, getTagColor };
