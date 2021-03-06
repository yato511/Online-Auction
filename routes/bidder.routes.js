const express = require("express");
const passport = require("passport");
const passportfb = require("passport-facebook");
const bcrypt = require("bcryptjs");
const userModel = require("../models/user.model");
const productModel = require("../models/product.model");
const cateModel = require("../models/category.model");
const config = require("../config/default.json");
const querystring = require("querystring");
const checkUser = require("../middlewares/user.mdw");
const moment = require("moment");
const mailer = require("../middlewares/mail.mdw");
const numeral = require("numeral");
const otpGenerator = require('otp-generator')
const rp = require("request-promise");

const router = express.Router();

router.get("/", async (req, res) => {
  const [
    productsToEnd,
    productsMostBid,
    productsHighestPrice,
    productsNew
  ] = await Promise.all([
    productModel.productsToEnd(),
    productModel.productsMostBid(),
    productModel.productsHighestPrice(),
    productModel.productsNew()
  ]);

  for (const product of productsToEnd) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productsToEnd) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  for (const product of productsMostBid) {
    product.mainImgSrc = await productModel.singleMainImgSrcByProduct(
      product.productID
    );
    product.isExistWishItem = req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false;
  }

  for (const product of productsMostBid) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  for (const product of productsHighestPrice) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productsHighestPrice) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  for (const product of productsNew) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productsNew) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  res.render("vwUser/index", {
    title: "Trang chủ",
    user: req.user,
    showNavbar: true,
    notShowBreadcumb: true,
    productsToEnd,
    productsMostBid,
    productsHighestPrice,
    productsNew
  });

  req.session.lastUrl = req.originalUrl;
});

router.get("/productList/:cateID/:subcateID", async (req, res) => {
  const {
    cateID,
    subcateID
  } = req.params;
  const limit = config.paginate.limit;
  let page = req.query.page || 1;
  if (page < 1) page = 1;
  const offset = (page - 1) * limit;

  const option = req.query.option || 0;
  const order = req.query.order || 0;

  const total = await productModel.countBySubCat(cateID, subcateID);
  let productList;

  if (option == 0) {
    if (order == 0) {
      productList = await productModel.pageBySubCatDefault(
        cateID,
        subcateID,
        offset
      );
    } else {
      productList = await productModel.pageBySubCat(
        cateID,
        subcateID,
        offset,
        "(endDate - NOW())",
        "desc"
      );
    }
  } else {
    if (order == 0) {
      productList = await productModel.pageBySubCat(
        cateID,
        subcateID,
        offset,
        "currentPrice",
        "asc"
      );
    } else {
      productList = await productModel.pageBySubCat(
        cateID,
        subcateID,
        offset,
        "currentPrice",
        "desc"
      );
    }
  }

  for (const product of productList) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productList) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  let nPages = Math.floor(total / limit);
  if (total % limit > 0) nPages++;
  const page_numbers = [];
  for (i = 1; i <= nPages; i++) {
    page_numbers.push({
      value: i,
      isCurrentPage: i === +page,
      option: option,
      order: order
    });
  }

  const cateName = await cateModel.getCateName(cateID);
  const subCateName = await cateModel.getSubCateName(cateID,subcateID);

  res.render("vwUser/product-list", {
    user: req.user,
    productList,
    empty: productList.length === 0,
    title: `${cateName} - ${subCateName}`,
    page_numbers,
    prev_value: +page - 1,
    next_value: +page + 1,
    isNotFirst: +page !== 1,
    isNotLast: +page !== nPages,
    option,
    order
  });

  req.session.lastUrl = req.originalUrl;
});

router.post("/productList/:cateID/:subcateID", (req, res) => {
  const query = querystring.stringify({
    option: req.body.option,
    order: req.body.order
  });

  res.redirect(
    `/productList/${req.params.cateID}/${req.params.subcateID}/?${query}`
  );
});

router.get("/productList/:cateID", async (req, res) => {
  const cateID = req.params.cateID;
  const limit = config.paginate.limit;
  let page = req.query.page || 1;
  if (page < 1) page = 1;
  const offset = (page - 1) * limit;

  const option = req.query.option || 0;
  const order = req.query.order || 0;

  const total = await productModel.countByCat(cateID);
  let productList;

  if (option == 0) {
    if (order == 0) {
      productList = await productModel.pageByCatDefault(
        cateID,
        offset
      );
    } else {
      productList = await productModel.pageByCat(
        cateID,
        offset,
        "(endDate - NOW())",
        "desc"
      );
    }
  } else {
    if (order == 0) {
      productList = await productModel.pageByCat(
        cateID,
        offset,
        "currentPrice",
        "asc"
      );
    } else {
      productList = await productModel.pageByCat(
        cateID,
        offset,
        "currentPrice",
        "desc"
      );
    }
  }

  for (const product of productList) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productList) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  let nPages = Math.floor(total / limit);
  if (total % limit > 0) nPages++;
  const page_numbers = [];
  for (i = 1; i <= nPages; i++) {
    page_numbers.push({
      value: i,
      isCurrentPage: i === +page,
      option: option,
      order: order
    });
  }

  const cateName = await cateModel.getCateName(cateID);

  res.render("vwUser/product-list", {
    user: req.user,
    productList,
    empty: productList.length === 0,
    title: cateName,
    page_numbers,
    prev_value: +page - 1,
    next_value: +page + 1,
    isNotFirst: +page !== 1,
    isNotLast: +page !== nPages,
    option,
    order
  });

  req.session.lastUrl = req.originalUrl;
});

router.post("/productList/:cateID", (req, res, next) => {
  const query = querystring.stringify({
    option: req.body.option,
    order: req.body.order
  });
  res.redirect(
    `/productList/${req.params.cateID}/?${query}`
  );
});

router.get("/product/:productID", async (req, res) => {
  const [
    productSingle,
    listImgSrc,
    desc,
    productBid,
    countBid,
    seller
  ] = await Promise.all([
    productModel.single(req.params.productID),
    productModel.singleImgSrcByProduct(req.params.productID),
    productModel.allDescByProduct(req.params.productID),
    productModel.singleBidByProduct(req.params.productID),
    productModel.countBidProduct(req.params.productID),
    productModel.getSellerByProduct(req.params.productID)
  ]);

  const product = productSingle[0];
  product.isEndBid = moment(product.endDate).valueOf() < Date.now();
  const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
  const minutes = moment().diff(temp, "minutes");
  for (const pb of productBid) {
    pb.bidderName = await userModel.getNameById(pb.bidderID);
  }

  let winner;
  if (productBid.length > 0) {
    winner = await productModel.getWinnerOfBidByProduct(product.productID);
    winner.point = await userModel.getPointEvaluation(winner.userID);
  }
  seller.point = await userModel.getPointEvaluation(seller.userID);

  const productListSame = await productModel.sameBySubCate(
    req.params.productID,
    product.cateID,
    product.subcateID
  );
  for (const product of productListSame) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productListSame) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  res.render("vwUser/product-details", {
    user: req.user,
    seller,
    winner,
    isBided: productBid.length > 0,
    product,
    productBid,
    bidPrice: product.stepPrice + product.currentPrice,
    listImgSrc,
    desc,
    emptyImg: listImgSrc.length === 0,
    title: "Chi tiết sản phẩm",
    message: req.query.message,
    status: req.query.status,
    isSeller: req.user ? product.seller === req.user.userID : false,
    isExistWishItem: req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) : false,
    isHot: countBid >= config.product.countBidIsHot,
    isNew: minutes <= config.product.minutesIsNew,
    productListSame
  });
  req.session.lastUrl = req.originalUrl;
});

router.get("/product/getbidtable/:productID", async (req, res) => {
  const data = await productModel.singleBidByProduct(req.params.productID);
  for (let p of data) {
    p.bidderName = await userModel.getNameById(p.bidderID);
    var temp = p.bidderName.split(" ");
    p.bidderName = "****" + temp[temp.length - 1];
    p.price = numeral(p.priceHold).format(0, 0);
    p.bidTime = moment(p.bidTime).format("DD/MM/YYYY") + "  [" + moment(p.bidTime).format("HH:mm:ss") + "]";
  }
  res.send({
    "draw": 1,
    "recordsTotal": data.length,
    "recordsFiltered": data.length,
    data: data
  })
})

router.post("/product/:productID/bid", checkUser.checkAuthenticatedPost, async (req, res) => {
  const productSingle = await productModel.single(req.params.productID);
  const product = productSingle[0];
  const point = await userModel.getPointEvaluation(req.user.userID);
  const checkPoint = point < product.minPoint;
  const checkBan = await productModel.checkBanBid(
    req.params.productID,
    req.user.userID
  );
  let query;
  if (checkBan) {
    query = querystring.stringify({
      status: false,
      message: "Bạn đã bị cấm đấu giá sản phẩm này!!!"
    });
  } else {
    if (checkPoint) {
      query = querystring.stringify({
        status: false,
        message: "Điểm của bạn không đủ để tham gia phiên đấu giá này!!!"
      });
    } else {
      if (req.body.isEndBid === "true") {
        query = querystring.stringify({
          status: false,
          message: "Phiên đấu giá đã kết thúc!"
        });
      } else {
        if (product.seller === req.user.userID) {
          query = querystring.stringify({
            status: false,
            message: "Bạn là người bán sản phẩm này, không thể ra giá!"
          });
        } else {
          query = querystring.stringify({
            status: true,
            message: "Ra giá thành công!"
          });

          const oldHolder = await productModel.getWinnerOfBidByProduct(
            product.productID
          );
          const price = numeral(req.body.bidPrice).value();
          const immePrice = product.immePrice || 0;
          let currentPrice = product.currentPrice;
          const priceHold = await productModel.getPriceOfHolderByProduct(
            product.productID
          );
          let isHolder;
          if (+price === immePrice) {
            currentPrice = immePrice;
            isHolder = 1;
            product.endDate = new Date();
          } else {
            if (price <= priceHold) {
              currentPrice = price;
              isHolder = 0;
            } else {
              if (priceHold !== 0) {
                // currentPrice = priceHold + product.stepPrice;
                currentPrice = priceHold;
              }
              isHolder = 1;
            }
            if (product.autoExtend) {
              const temp = moment(product.endDate, "YYYY-MM-DD HH:mm:ss");
              let minutes = moment().diff(temp, "minutes");
              if (minutes >= -5) {
                product.endDate = moment(product.endDate).add(10, "minutes");
                product.endDate = moment(product.endDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                );
              }
            }
          }
          
          product.currentPrice = currentPrice;

          const entity = {
            productID: req.params.productID,
            bidderID: req.user.userID,
            price,
            priceHold: currentPrice,
            bidTime: new Date(),
            isHolder
          };
          if (isHolder === 1) {
            await productModel.setFalseIsHolderProductBid(product.productID);
          }
          await productModel.addProductBid(entity);
          await productModel.updateProductCurrentPrice({
            productID: product.productID,
            currentPrice,
            endDate: product.endDate
          });

          //Gui mail
          const seller = await userModel.getUserById(product.seller);
          const sellerEMail = seller[0].email;

          const bidderEmail = req.user.email;

          const oldHolderEmail = oldHolder == false ? false : oldHolder.email;

          await mailer.sendMailConfirmBid(
            sellerEMail,
            bidderEmail,
            oldHolderEmail,
            product
          );
        }
      }
    }
  }

  res.redirect(`/product/${req.params.productID}/?${query}`);
});

router.post("/product/:productID/:bidderID/refuseBid", async (req, res) => {
  const rows = await productModel.single(req.body.productID);
  const product = rows[0];
  const isSeller = req.user ? product.seller === req.user.userID : false;
  product.isEndBid = moment(product.endDate).valueOf() < Date.now();
  if (isSeller && !product.isEndBid) {
    await productModel.cancelProductBid(req.body.productID, req.body.bidderID);
    await productModel.addBanBid({
      productID: req.body.productID,
      bidderID: req.body.bidderID
    });

    let currentPrice = await productModel.getProductCurrentPrice(
      product.productID
    );
    if (currentPrice === 0) {
      currentPrice = product.beginPrice;
    }
    await productModel.updateProductCurrentPrice({
      productID: product.productID,
      currentPrice
    });

    await productModel.updateProductBidIsHolder(product.productID);

    //Gui mail cho nguoi dau gia
    const bidder = await userModel.getUserById(req.body.bidderID);
    const bidderEmail = bidder[0].email;
    await mailer.sendMailRefuseBidToSBidder(bidderEmail, product);

    res.json("1");
  } else {
    res.json("0");
  }
});

router.post(
  "/product/:productID/addToWishList",
  async (req, res) => {
    if (!req.isAuthenticated()) {
      res.json("-1");
    } else {
      const productID = req.params.productID;
      const userID = req.user.userID;
      const check = await productModel.isExistWishItem(productID, userID);
      if (check) {
        res.json("0");
      } else {
        const entity = {
          productID,
          userID
        };
        await productModel.addWishItem(entity);
        res.json("1");
      }
    }
  }
);

router.post(
  "/product/:productID/deleteToWishList",
  checkUser.checkAuthenticatedPost,
  async (req, res) => {
    const productID = req.params.productID;
    const userID = req.user.userID;

    await productModel.deleteWishItem(productID, userID);
    res.json("1");
  }
);

router.post("/search/", (req, res) => {
  const category = req.body.category;
  const textSearch = req.body.textSearch;
  if (textSearch)
    res.redirect(`/productList/search/${category}/${textSearch}`);
  else
    res.redirect(`/productList/${category}`);
});

router.get("/productList/search/:category/:textSearch", async (req, res) => {
  const category = req.params.category;
  const textSearch = req.params.textSearch;

  let productList;
  let total;
  const limit = config.paginate.limit;
  let page = req.query.page || 1;
  if (page < 1) page = 1;
  const offset = (page - 1) * limit;

  const option = req.query.option;
  const order = req.query.order;


  if (category == 0) {
    total = await productModel.countByText(textSearch);
    if(typeof option === "undefined" && typeof option === "undefined")
      {
        productList = await productModel.pageByTextDefault(textSearch, offset);
      }
    if (option == 0) {
      if (order == 0) {
        productList = await productModel.pageByText(
          textSearch,
          offset,
          "(endDate - NOW())",
          "asc"
        );
      } else {
        productList = await productModel.pageByText(
          textSearch,
          offset,
          "(endDate - NOW())",
          "desc"
        );
      }
    } else {
      if (order == 0) {
        productList = await productModel.pageByText(
          textSearch,
          offset,
          "currentPrice",
          "asc"
        );
      } else {
        productList = await productModel.pageByText(
          textSearch,
          offset,
          "currentPrice",
          "desc"
        );
      }
    }
  } else {
    total = await productModel.countByCateAndText(textSearch, category);
    if(typeof option === "undefined" && typeof option === "undefined")
    {
      productList = await productModel.pageByTextDefault(textSearch, offset);
    }
    if (option == 0) {
      if (order == 0) {
        productList = await productModel.pageByCateAndTextDefault(
          textSearch,
          category,
          offset
        );
      } else {
        productList = await productModel.pageByCateAndText(
          textSearch,
          category,
          offset,
          "(endDate - NOW())",
          "desc"
        );
      }
    } else {
      if (order == 0) {
        productList = await productModel.pageByCateAndText(
          textSearch,
          category,
          offset,
          "currentPrice",
          "asc"
        );
      } else {
        productList = await productModel.pageByCateAndText(
          textSearch,
          category,
          offset,
          "currentPrice",
          "desc"
        );
      }
    }
  }

  for (const product of productList) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productList) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  let nPages = Math.floor(total / limit);
  if (total % limit > 0) nPages++;
  const page_numbers = [];
  for (i = 1; i <= nPages; i++) {
    page_numbers.push({
      value: i,
      isCurrentPage: i === +page,
      option: option,
      order: order
    });
  }

  res.render("vwUser/product-list", {
    user: req.user,
    productList,
    empty: productList.length === 0,
    title: "Tìm kiếm sản phẩm",
    textSearch,
    category,
    page_numbers,
    prev_value: +page - 1,
    next_value: +page + 1,
    isNotFirst: +page !== 1,
    isNotLast: +page !== nPages,
    option,
    order
  });
});

router.post("/productList/search/:category/:textSearch", async (req, res) => {
  const query = querystring.stringify({
    option: req.body.option,
    order: req.body.order
  });

  res.redirect(
    `/productList/search/${req.params.category}/${req.params.textSearch}/?${query}`
  );
});

router.get("/account", checkUser.checkAuthenticated, async (req, res) => {
  const user = req.user;
  const [
    productsHistoryBid,
    productsWishList,
    productsSelling,
    productsWinList,
    productsSoldEnd,
    evaluation,
    point,
  ] = await Promise.all([
    productModel.productsHistoryBid(user.userID),
    productModel.productsWishList(user.userID),
    productModel.productsSelling(user.userID),
    productModel.productsWinList(user.userID),
    productModel.productsSoldEnd(user.userID),
    userModel.getEvaluationById(user.userID),
    userModel.getPointEvaluation(user.userID),
  ]);

  user.point = point;

  for (const product of productsHistoryBid) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem,
      product.isEndBid,
      product.isWinner
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false,
      (product.isEndBid = moment(product.endDate).valueOf() < Date.now()),
      req.user ?
      (await productModel.getWinnerOfBidByProduct(product.productID))
      .userID === req.user.userID :
      false
    ]);
  }

  for (const product of productsHistoryBid) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;
    product.resultBid = product.isEndBid && product.isWinner;
  }

  for (const product of productsWishList) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productsWishList) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;

    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getNameWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  for (const product of productsSoldEnd) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productsSoldEnd) {
    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  for (const product of productsSelling) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);
  }

  for (const product of productsSelling) {
    product.isHot = product.countBid >= config.product.countBidIsHot;
    const temp = moment(product.beginDate, "YYYY-MM-DD HH:mm:ss");
    const minutes = moment().diff(temp, "minutes");
    product.isNew = minutes <= config.product.minutesIsNew;
    if (product.countBid > 0) {
      product.isBided = true;
      product.winner = await productModel.getWinnerOfBidByProduct(
        product.productID
      );
    } else {
      product.isBided = false;
    }
  }

  for (const product of productsWinList) {
    [
      product.mainImgSrc,
      product.countBid,
      product.isExistWishItem
    ] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.countBidProduct(product.productID),
      req.user ?
      await productModel.isExistWishItem(product.productID, req.user.userID) :
      false
    ]);

    product.seller = await productModel.getSellerByProduct(product.productID);
  }

  for (const e of evaluation) {
    e.senderName = await userModel.getNameById(e.sender);
  }
  res.render("vwUser/account", {
    user,
    title: "Quản lí tài khoản",
    productsHistoryBid,
    productsWishList,
    productsSelling,
    productsWinList,
    productsSoldEnd,
    evaluation,
    emptyProductsHistoryBid: productsHistoryBid.length === 0,
    emptyProductsWishList: productsWishList.length === 0,
    emptyProductsSelling: productsSelling.length === 0,
    emptyProductsWinList: productsWinList.length === 0,
    emptyProductsSoldEnd: productsSoldEnd.length === 0,
    emptyEvaluation: evaluation.length === 0
  });

  req.session.lastUrl = req.originalUrl;
});

router.post(
  "/account/:userID/updateInfor",
  checkUser.checkAuthenticatedPost,
  async (req, res) => {
    req.body.birthDay = moment(req.body.birthDay, "DD-MM-YYYY").format(
      "YYYY-MM-DD"
    );
    if (req.body.birthDay === 'Invalid date') req.body.birthDay = req.user.birthDay;
    await userModel.editUser(req.body);
    res.json("1");
  }
);

router.get(
  "/checkout/:productID",
  checkUser.checkAuthenticated,
  async (req, res) => {
    const rows = await productModel.single(req.params.productID);
    const product = rows[0];

    [product.mainImgSrc, product.sellerName] = await Promise.all([
      productModel.singleMainImgSrcByProduct(product.productID),
      productModel.getSellerNameByProduct(product.productID)
    ]);

    const transportPrice = config.checkout.transportPrice;

    res.render("vwUser/checkout", {
      user: req.user,
      product,
      transportPrice,
      totalPrice: +product.currentPrice + +transportPrice,
      title: "Thanh toán"
    });
    req.session.lastUrl = req.originalUrl;
  }
);

router.post(
  "/evaluation/seller/:productID",
  checkUser.checkAuthenticatedPost,
  async (req, res) => {
    const check = await userModel.checkExitsEvaluation(
      req.user.userID,
      req.body.sellerID,
      req.params.productID
    );
    if (!check) {
      const receiver = req.body.sellerID;
      const entity = {
        sender: req.user.userID,
        receiver,
        productID: req.params.productID,
        isGood: req.body.isGood,
        isBad: 1 - req.body.isGood,
        content: req.body.content,
        time: new Date()
      };
      await userModel.addUserEvaluation(entity);
      res.json("1");
    } else {
      res.json("0");
    }
  }
);

router.post("/evaluation/winner/:productID", checkUser.checkAuthenticatedPost, async (req, res) => {
  const check = await userModel.checkExitsEvaluation(
    req.user.userID,
    req.body.winnerID,
    req.params.productID
  );
  if (!check) {
    const receiver = req.body.winnerID;
    const entity = {
      sender: req.user.userID,
      receiver,
      productID: req.params.productID,
      isGood: req.body.isGood,
      isBad: 1 - req.body.isGood,
      content: req.body.content,
      time: new Date()
    };
    await userModel.addUserEvaluation(entity);
    res.json("1");
  } else {
    res.json("0");
  }
});

router.post("/refuse/winner/:productID", checkUser.checkAuthenticatedPost, async (req, res) => {
  const check = await userModel.checkExitsEvaluation(
    req.user.userID,
    req.body.winnerID,
    req.params.productID
  );
  if (!check) {
    const receiver = req.body.winnerID;
    const entity = {
      sender: req.user.userID,
      receiver,
      productID: req.params.productID,
      isGood: req.body.isGood,
      isBad: 1 - req.body.isGood,
      content: req.body.content,
      time: new Date(),
      isRefuse: 1,
    };
    await userModel.addUserEvaluation(entity);
    res.json("1");
  } else {
    res.json("0");
  }
});

router.get("/login", checkUser.checkNotAuthenticated, (req, res) => {
  let errMsg = null;
  if (req.session.flash != null)
    if (req.session.flash.error != null)
      if (req.session.flash.error.length) errMsg = req.session.flash.error[0];
  res.render("vwUser/login", {
    layout: false,
    email: req.session.email,
    message: errMsg
  });
  req.session.lastUrl = req.session.lastUrl;
});

router.get("/signup", checkUser.checkNotAuthenticated, (req, res) => {
  res.render("vwUser/signup", {
    layout: false,
    message: req.session.message,
    oldInfo: req.session.oldInfo
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Email hoặc mật khẩu không đúng",
    successFlash: "Welcome!"
  }),
  (req, res) => {
    res.locals.lcUser = req.user;
    if (req.session.lastUrl)
      res.redirect(req.session.lastUrl);
    else
      res.redirect('/');
  }
);

router.post("/signup", (req, res) => {
  if (
    req.body["g-recaptcha-response"] === undefined ||
    req.body["g-recaptcha-response"] === "" ||
    req.body["g-recaptcha-response"] === null
  ) {
    req.session.message = "Vui lòng xác thực reCaptcha";
    req.session.oldInfo = {
      name: req.body.name,
      password: req.body.password,
      address: req.body.address
    };
    res.redirect("/signup");
  }
  const secretKey = "6LciPMQUAAAAAERVOU-okuG7mbVdzS-9fuYTbd4O";
  let options = {
    method: "POST",
    uri: "https://www.google.com/recaptcha/api/siteverify",
    form: {
      secret: secretKey,
      response: req.body["g-recaptcha-response"]
    },
    json: true // Automatically stringifies the body to JSON
  };

  rp(options)
    .then(async response => {
      const existedUser = await userModel.getUserByEmail(req.body.email);
      if (existedUser.length) {
        req.session.message = "Email đã được sử dụng";
        req.session.oldInfo = {
          name: req.body.name,
          password: req.body.password,
          address: req.body.address
        };
        res.redirect("/signup");
      } else {
        try {
          const hashedPass = bcrypt.hashSync(req.body.password, 10);
          const newUser = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPass,
            address: req.body.address
          };
          const query = querystring.stringify(newUser);
          res.redirect(`/signup/checkotp/?${query}`);
        } catch (e) {
          console.log(e);
        }
      }
    })
    .catch(err => {
      req.session.message = "Xác thực reCaptcha thất bại";
      res.redirect("/signup");
    });
});

router.get("/signup/checkotp", async (req, res) => {
  req.session.otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false
  });
  await mailer.sendMailCheckOTP(req.query.email, req.session.otp);
  res.render("vwUser/checkotp", {
    layout: false,
    message: `Chúng tôi đã gửi mã otp đến email ${req.query.email}, hãy nhập mã OTP để xác nhận`,
    name: req.query.name,
    email: req.query.email,
    password: req.query.password,
    address: req.query.address
  });
});

router.post("/signup/checkotp", async (req, res) => {
  const checkOTP = (req.body.otp == req.session.otp);
  if (checkOTP) {
    const newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      address: req.body.address
    };
    await userModel.newUser(newUser);
    req.session.email = newUser.email;
    res.redirect('/login')
  } else {
    res.render("vwUser/checkotp", {
      layout: false,
      message: `Mã OTP bạn nhập không đúng mời nhập lại`,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      address: req.body.address
    });
  }
});

router.get("/login/fb", passport.authenticate('facebook', {
  scope: ['email']
}));

router.get("/login/fb/cb", passport.authenticate('facebook', {
  failureRedirect: '/login',
  successRedirect: '/',
}));

router.get("/logout", (req, res) => {
  req.logout();
  res.locals.lcUser = {};
  req.session.destroy();
  // res.redirect(req.headers.referer);
  res.redirect("/");
});

router.get('/non-permission', (req, res) => {
  res.render("vwUser/non-permission", {
    user: req.user,
    notShowBreadcumb: true,
    link: req.session.lastUrl
  });
});

router.get('/user-eval-detail/:userID', async (req, res) => {
  const target = await userModel.getUserById(req.params.userID)
  if (target.length === 0) {
    res.render('vwUser/not-found', {
      title: 'Không tìm thấy trang',
      notShowBreadcumb: true
    })
  } else {
    const evaluation = await userModel.getEvaluationById(req.params.userID)
    for (const e of evaluation) {
      e.senderName = await userModel.getNameById(e.sender);
    }
    res.render("vwUser/user-eval-detail", {
      title: 'Các lượt đánh giá',
      user: req.user,
      notShowBreadcumb: true,
      target: target[0],
      evaluation,
      emptyEvaluation: evaluation.length === 0
    })
  }
})


router.post('/account/seller-regis', checkUser.checkAuthenticatedPost, async (req, res) => {
  try {
    await userModel.registerSeller(req.body.userID);
    res.json("1");
  } catch {
    res.json("0");
  }
})

router.post('/account/change-pass/:userID', checkUser.checkAuthenticatedPost, async (req, res) => {
  const userID = req.params.userID;
  const newPass = bcrypt.hashSync(req.body.newPass, 10);
  try {
    const rs = await userModel.getUserById(userID);
    const matchUser = rs[0];
    if (await bcrypt.compareSync(req.body.oldPass, matchUser.password)) {
      await userModel.changePassword(userID, newPass)
      req.logout();
      res.locals.lcUser = {};
      res.json("1");
    } else {
      res.json("0");
    }
  } catch (e) {
    console.log(e);
    res.json("-1");
  }
})
module.exports = router;