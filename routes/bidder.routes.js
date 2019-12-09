//Định nghĩa tất cả đường dẫn liên quan tới user ẩn danh (chưa đăng nhập) hoặc user bình thường (bidder)
//Đường dẫn sẽ có dạng /user/...
//Ví dụ: /user/index => Trang chủ
//       /user/productList/:cateID/:subcateID => Danh sách các sản phẩm thuộc category có id là cateID và subcateID

const express = require("express");

const categoryModel = require("../models/category.model");
const productModel = require("../models/product.model");

const router = express.Router();

router.get("/", async (req, res) => {
  res.render("vwUser/index", {
    layout: "home-layout.hbs",
    title: "Trang chủ"
  });
});


//Link: /user/productList/cateID/subcateID
router.get("/productList/:cateID/:subcateID", async (req, res) => {
  const productList = await productModel.allBySubCate(
    req.params.cateID,
    req.params.subcateID
  );
  
  for (const product of productList) {
    const rows = await productModel.singleImgSrcByProduct(product.productID);
    if (rows.length >= 1) {
      product.mainImgSrc = rows[0].imgSrc;
    }
  }
  
  res.render("vwUser/product-list", {
    productList,
    empty: productList.length === 0,
    title: "Danh sách",
  });
});

//Link: /user/product/:productID
router.get("/product/:productID", async (req, res) => {
  const rows = await productModel.single(req.params.productID);
  const listImgSrc = await productModel.singleImgSrcByProduct(req.params.productID);
  const note = await productModel.singleNoteByProduct(req.params.productID);
  res.render("vwUser/product-details", {
    product: rows[0],
    listImgSrc,
    note,
    emptyImg: listImgSrc.length === 0,
    title: "Chi tiết sản phẩm",
  });
});

//Từ đây phải kiểm tra đăng nhập (đăng nhập dùng passport.js)
//Link: /user/account
router.get("/account", async (req, res) => {
  //Quản lý tài khoản
  //render account.hbs
});

//Link: /user/checkout/:productID
router.get("/checkout/:productID", async (req, res) => {
  //Thanh toán
  //render checkout.hbs
});

//Cứ tạm thời như thế này đã, chứ đúng ra thì có cái folder controller kia
//Cũng có tương tự các file admin, bidder, seller để tập hợp các hàm xử lý cho từng cái routes này
//Ví dụ cái router.get('/') trên cùng thì copy hết cái hàm xử lý vào trong bidder.controller, export ra
//Rồi cái file này chỉ cần require rồi gọi lại nó là được
//Link: https://www.youtube.com/watch?v=XsyJzULs8z0&t=445s

module.exports = router;