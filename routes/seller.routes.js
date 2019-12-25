const express = require("express");

const productModel = require("../models/product.model");
const categoryModel = require("../models/category.model");
const descModel = require("../models/description.model")
const upload = require("../middlewares/upload.mdw");
const fs = require('fs-extra')
const router = express.Router();
const uuid = require('uuid/v1');
const checkUser = require("../middlewares/user.mdw");
const numeral = require('numeral');

router.get("/new-product", checkUser.checkSeller, async (req, res, next) => {
    res.render("vwSeller/new-product", {
        user: req.user,
        title: "Mở phiên đấu giá",
        id: uuid(),
    });

    req.session.lastUrl = req.originalUrl;
});

var filesConfig = [{
    name: 'fileMain',
    maxCount: 1
}, {
    name: 'filesThumb[]'
}];
router.post("/new-product/", upload.fields(filesConfig), checkUser.checkAuthenticatedPost, async (req, res, next) => {
    const productCate = await categoryModel.getFromName(req.body.productCate);
    const entityProductSingle = {
        productID: req.body.id,
        productName: req.body.productName,
        cateID: productCate.cateID,
        subcateID: productCate.subcateID,
        seller: req.user.userID,
        brand: req.body.brand,
        pFrom: req.body.pFrom,
        beginPrice: numeral(req.body.beginPrice).value(),
        currentPrice: numeral(req.body.beginPrice).value(),
        stepPrice: numeral(req.body.stepPrice).value(),
        immePrice: numeral(req.body.immePrice).value(),
        beginDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        autoExtend: req.body.autoExtend === "on",
    }

    const entityDesc = {
        productID: req.body.id,
        descContents: req.body.description,
        descDate: new Date()
    }

    await productModel.addProductSingle(entityProductSingle);
    await descModel.addDesc(entityDesc)

    const mainImg = req.files.fileMain;
    let entityProductImg = {
        productID: req.body.id,
        imgSrc: mainImg[0].filename,
        isMain: 1,
    }
    await productModel.addProductImg(entityProductImg);
    for (const file of req.files['filesThumb[]']) {
        entityProductImg = {
            productID: req.body.id,
            imgSrc: file.filename,
        }
        await productModel.addProductImg(entityProductImg);
    }

    res.redirect(`/product/${req.body.id}`);
});

router.post("/product/:productID/delete", async (req, res) => {
    const rows = await productModel.single(req.params.productID);
    const product = rows[0];
    if (product.seller === req.user.userID) {
        await productModel.deleteProduct(req.params.productID);

        const dir = `./public/img/product/${req.params.productID}`;
        fs.exists(dir, exist => {
            if (exist) {
                fs.remove(dir, (error) => {
                    if (error) console.log(error.message);
                })
            }
        })

    }
    res.send(req.params.productID);
});

router.post("/product/:productID/addDesc", async (req, res) => {
    const entityDesc = {
        productID: req.params.productID,
        descContents: req.body.desc,
        descDate: new Date()
    };
    await descModel.addDesc(entityDesc)

    res.redirect(`/product/${req.params.productID}`)
})

module.exports = router;