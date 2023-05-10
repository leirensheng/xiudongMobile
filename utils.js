let request = (options) =>
  new Promise((resolve, reject) => {
    uni.request({
      ...options,
      timeout: options.timeout|| 20000,
      success: (res) => {
        console.log(res);
        let { code, data, msg } = res.data;
        let tips = msg;
        if (code !== 0) {
          tips = msg || "出错";
        }
        if (tips) {
          uni.showToast({
            title: tips,
            icon: "error",
            duration: 2000,
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
    });
  });
export { request };
