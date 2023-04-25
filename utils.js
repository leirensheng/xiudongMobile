let request = (options) =>
  new Promise((resolve, reject) => {
    uni.request({
      ...options,
      timeout: 20000,
      success: (res) => {
        console.log(res);
        let { code, data } = res.data;
        // if(code!==0){
        // reject()
        // }else{
        resolve(res.data);
        // }
      },
      fail: (e) => {
        reject(e);
      },
    });
  });
export { request };
