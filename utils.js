let request = (options) =>
  new Promise((resolve, reject) => {
    uni.request({
      ...options,
      timeout: 20000,
      success: (res) => {
        console.log(res);
        let { code, data,msg } = res.data;
        if (code !== 0) {
          uni.showToast({
            title:msg|| '出错',
            icon:'error',
            duration: 2000
          });
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
