document.querySelector('#lite-shop-order').onsubmit = function (event) {
  event.preventDefault();
  let username = document.querySelector('#username').value.trim();
  let phone = document.querySelector('#phone').value.trim();
  let email = document.querySelector('#email').value.trim();
  let adress = document.querySelector('#adress').value.trim();

  if(!document.querySelector('#rule').checked){
    //c правилами не согласен
    Swal.fire({
      title: 'Warning',
      text: 'Read and accept the rules',
      type: 'info',
      confirmButtonText: 'Ok'
    });
  } else if (username === "" || phone === "" || email === "" || adress === ''){
    //не заполнені поля
    Swal.fire({
      title: 'Warning',
      text: 'Fill all fields',
      type: 'info',
      confirmButtonText: 'Ok'
    });
  } else {
    fetch('/finish-order', {
      method: 'POST',
      body: JSON.stringify({
        'username': username,
        'phone': phone,
        'adress': adress,
        'email': email,
        'key': JSON.parse(localStorage.getItem('cart'))
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(function (response) {
      return response.text();
    }).then(function (body) {
      if(body == 1){
        Swal.fire({
          title: 'Success',
          text: 'Success',
          type: 'info',
          confirmButtonText: 'Ok'
        });
      }else {
        Swal.fire({
          title: 'Problem with mail',
          text: 'Error',
          type: 'error',
          confirmButtonText: 'Ok'
        });
      }
    })
  }

};