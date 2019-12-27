let express = require('express');
let app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer({dest: "public/images"});
var fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(express.static('public'));

app.set('view engine', 'pug');

let mysql = require('mysql');

app.use(express.json());

const nodemailer = require('nodemailer');

let con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'foREVera7x',
    database: 'market',
    multipleStatements: "true"
});

app.listen(3000, function () {
  console.log('node express work on 3000');
});


app.get('/', function (req, res) {
  let cat = new Promise(function (resolve, reject) {
    con.query(
        "SELECT id, name, cost, image, category from (SELECT id, name, cost, image,category, if(if(@curr_category != category, @curr_category :=" +
        " category, '') != '', @k :=0, @k := @k + 1) as ind FROM goods, (SELECT @curr_category := '' ) v ) goods WHERE ind < 3",
        function (error, result, field) {
          if (error) return reject(error);
          resolve(result);
        }
    )
  });

  let catDescription = new Promise(function (resolve, reject) {
    con.query(
        "SELECT * FROM category ",
        function (error, result, field) {
          if (error) return reject(error);
          resolve(result);
        }
    )
  });
  Promise.all([cat, catDescription]).then(function (value) {
    console.log(value[1]);
    res.render('index', {
      goods: JSON.parse(JSON.stringify(value[0])),
      cat: JSON.parse(JSON.stringify(value[1]))
    });
  });
});


app.get('/admin/goods', function (req, res) {
  let admin_goods = new Promise(function (resolve, reject) {
    con.query(
      "SELECT * FROM category; SELECT category.id, category.category, goods.* FROM category INNER JOIN goods ON category.id = goods.category;",
        function (error, result, field) {
          if (error) return reject(error);
          resolve(result);
        }
    )
  })
  .then(function(result){
    res.render('admin_good.ejs', {
      categories: result[0],
      goods: result[1]
    });
  })
});

app.post('/admin/goods/delete', function (req, res) {
  let admin_goods = new Promise(function (resolve, reject) {
    let { good_id } = req.body;
    con.query(
      "DELETE FROM goods WHERE id = " + good_id + ";",
        function (error, result, field) {
          if (error) return reject(error);
          resolve(result);
        }
    )
  })
  .then(function(result){
    res.send({
      message: "Товар був успішно видалений"
    });
  })
});

app.get('/admin/goods/add', function (req, res) {
  let admin_goods = new Promise(function (resolve, reject) {
    con.query(
      `SELECT * FROM category;`,
        function (error, result, field) {
          if (error) return reject(error);
          resolve(result);
        }
    );
  })
  .then(function(result){
    console.log(result);
    res.render('admin_add_edit_good.ejs', {good: null, categories: result});
  });
});

app.get('/admin/goods/edit/:good_id', function (req, res) {
  let admin_goods = new Promise(function (resolve, reject) {
    let good_id = req.params.good_id;
    con.query(
      `SELECT * FROM goods WHERE id = '${good_id}'; SELECT * FROM category;`,
        function (error, result, field) {
          if (error) return reject(error);
          resolve(result);
        }
    );
  })
  .then(function(result){
    console.log(result[0]);
    res.render('admin_add_edit_good.ejs', {
      good: result[0][0],
      categories: result[1]
    });
  })
});

app.post('/admin/goods/edit', function (req, res) {
  let admin_goods = new Promise(function (resolve, reject) {
    console.log(req.body);
    let {id, name, description, cost, category} = req.body;
    con.query(
      `UPDATE goods SET name = '${name}', description = '${description}', cost = '${cost}', category = '${category}' WHERE id = '${id}';`,
        function (error, result, field) {
          if (error) return reject(error);
          resolve(result);
        }
    );
  })
  .then(function(result){
    res.send({message: "Успішно"});
  })
});

app.post('/admin/goods/add', function (req, res) {
  let admin_goods = new Promise(function (resolve, reject) {
    console.log(req.body);
    let { name, description, cost, category } = req.body;
    con.query(
      `INSERT INTO goods (name, description, cost, category) VALUES ('${name}', '${description}', '${cost}', '${category}');`,
        function (error, result, field) {
          if (error) return reject(error);
          resolve(result);
        }
    );
  })
  .then(function(result){
    res.send({message: "Успішно"})
  })
});


app.get('/cat', function(req, res){
  // console.log(req.query.id);
  let catId = req.query.id;

  let cat = new Promise(function (resolve, reject) {
    con.query(
      'SELECT * FROM category WHERE id=' + catId,
      function(error, result){
        if(error) reject(error);
        resolve(result);
      }
    );
  });

  let goods = new Promise(function (resolve, reject) {
    con.query(
        'SELECT * FROM goods WHERE category=' + catId,
        function(error, result){
          if(error) reject(error);
          resolve(result);
        }
    );
  });

  Promise.all([cat, goods]).then(function(value){
    // console.log(value[0]);
    res.render('cat', {
      cat: JSON.parse(JSON.stringify(value[0])),
      goods: JSON.parse(JSON.stringify(value[1]))
    });
  });

});

app.get('/goods', function(req, res) {
  // console.log(req.query.id);
  con.query('SELECT * FROM goods WHERE id=' + req.query.id, function (error, result, fields) {
    if(error) throw error;
    res.render('goods', { goods: JSON.parse(JSON.stringify(result)) });
  });
});

app.get('/order', function(req, res) {
    res.render('order');
});

app.post('/get-category-list', function (req,res) {
  con.query('SELECT id, category FROM category', function (error, result, fields) {
    if(error) throw error;
    // console.log(result);
    res.json(result);
  });
});

app.post('/get-goods-info', function (req,res) {
  // console.log('1:', req.body.key);
  if(req.body.key.length !=0){
    con.query('SELECT id, name, cost FROM goods WHERE id IN(' + req.body.key.join(',') + ')', function (error, result, fields) {
      if(error) throw error;
      let goods = {};
      for(let i = 0; i < result.length; i++){
        goods[result[i]['id']] = result[i];
      }
      // console.log(result);
      res.json(goods);
    });
  } else{
    res.send('0');
  }

});

app.post('/finish-order', function (req,res) {
  console.log(req.body);

  if(req.body.key.length !=0){
    let key = Object.keys(req.body.key);
    con.query('SELECT id, name, cost FROM goods WHERE id IN(' + key.join(',') + ')', function (error, result, fields) {
      if (error) throw error;
      sendMail(req.body, result).catch(console.error);
      res.send('1');
    });
  } else{
    res.send('0');
  }

});

async function sendMail(data, result){
  let res = '<h2>Order in Your toys</h2>';
  let total = 0;
  for(let i = 0; i < result.length; i++){
    res += `<p>${result[i]['name']} - ${data.key[result[i]['id']]} - ${result[i]['cost'] * data.key[result[i]['id']]} uah</p>`;
    total += result [i]['cost'] * data.key[result[i]['id']];
  }
  // console.log(res);
  res +='<hr>';
  res += `Total ${total} uah`;
  res += `<hr>Phone: ${data.phone}`;
  res += `<hr>Username: ${data.username}`;
  res += `<hr>Address: ${data.adress}`;
  res += `<hr>Email: ${data.email}`;
  console.log(res);
  // let testAccount = await nodemailer.createTestAccount();
  //
  // let transporter = nodemailer.createTransport({
  //   host: "smtp.ethereal.email",
  //   port: 587,
  //   secure: false, // true for 465, false for other ports
  //   auth: {
  //     user: testAccount.user, // generated ethereal user
  //     pass: testAccount.pass // generated ethereal password
  //   }
  // });
  //
  // let mailOption = {
  //   from: '<viacheslav.klycnhyk@gmail.com>',
  //   to: 'viacheslav.klycnhyk@gmail.com,' + data.email,
  //   subject: 'Lite shop order',
  //   text: 'Hello world',
  //   html: res
  // };
  //
  // let info = await transporter.sendMail(mailOption);
  // console.log("MessageSent: $s", info.messageId);
  // console.log("PreviewSent: $s", info.getTestMessageUrl(info));

  const send = require('gmail-send')({
    user: 'viacheslav.klynchyk@gmail.com',
    pass: '4451qwer',
    to: data.email,
    subject: 'Your toys',
  });

  send({
    html: res,
  }, (error, result, fullResult) => {
    if (error) console.error(error);
    console.log(result);
  });

  return true;
}

