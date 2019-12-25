var nodemailer = require('nodemailer');

const option = {
    service: 'gmail',
    auth: {
        user: 'web1712795@gmail.com',
        pass: 'bitcube1408'
    }
};
var transporter = nodemailer.createTransport(option);

function sendMail(from, to, subject, html) {
    transporter.verify(function (error, success) {
        if (error) {
            console.log(error);
        } else {
            console.log('Kết nối thành công!');
            var mail = {
                from,
                to,
                subject,
                html
            };
            transporter.sendMail(mail, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    });
};

module.exports = {
    sendMail: () => {
        console.log("send mail");
    },

    sendMailEndBidToBidder: (userMail, product) => {
        const from = 'web1712795@gmail.com';
        const to = userMail;
        const subject = 'Thông báo từ BidHub: bạn đã chiến thắng trong phiên đấu giá';
        const html = `<h3>Tên sản phẩm: ${product.productName}</h3>
        <h3>Giá: ${product.currentPrice}</h3>
        <h3>Thời điểm kết thúc: ${product.endDate}</h3>
        <a href="http://localhost:3000/checkout/${product.productID}">Thanh toán tại đây</a>`;
        return sendMail(from, to, subject, html);
    },

    sendMailEndBidToSeller: (userMail, product, isBided) => {
        const from = 'web1712795@gmail.com';
        const to = userMail;
        const subject = 'Thông báo từ BidHub: sản phẩm của bạn đã hết thời gian đấu giá '
        let html = `<h3>Tên sản phẩm: ${product.productName}</h3>
        <h3>Giá: ${product.currentPrice}</h3>
        <h3>Thời điểm kết thúc: ${product.endDate}</h3>
        <a href = "http://localhost:3000/product/${product.productID}">Xem chi tiết tại đây</a>`;
        if (isBided == false)
            html = `<h3>Tên sản phẩm: ${product.productName}</h3>
            <h3>Giá: ${product.price}</h3>
            <h3>Thời điểm kết thúc: ${product.endDate}</h3>
            <h3>Chưa có ai đấu giá sản phẩm này!!!</h3>
            <a href = "http://localhost:3000/product/${product.productID}">Xem chi tiết tại đây</a>`
        return sendMail(from, to, subject, html);
    },

    sendMailRefuseBidToSBidder: (userMail, product) => {
        const from = 'web1712795@gmail.com';
        const to = userMail;
        const subject = 'Thông báo từ BidHub: bạn đã bị từ chối đấu giá'
        let html = `<h3>Tên sản phẩm: ${product.productName}</h3>
        <h3>Giá: ${product.currentPrice}</h3>
        <h3>Bạn không thể đấu giá sản phẩm này nữa!!!</h3>
        <a href = "http://localhost:3000/account#bid-history">Xem chi tiết tại đây</a>`;
        return sendMail(from, to, subject, html);
    },

    sendMailConfirmBid: (sellerEMail, bidderEmail, oldHolderEmail, product) => {
        const from = 'web1712795@gmail.com';
        let to = `${sellerEMail}, ${bidderEmail}, ${oldHolderEmail}`;
        if (oldHolderEmail == false)
            to = `${sellerEMail}, ${bidderEmail}`;
        const subject = 'Thông báo từ BidHub: giá sản phẩm đã được cập nhập'
        const html = `<h3>Tên sản phẩm: ${product.productName}</h3>
        <h3>Giá hiện tại: ${product.currentPrice}</h3>
        <a href = "http://localhost:3000/product/${product.productID}">Xem chi tiết tại đây</a>`;
        return sendMail(from, to, subject, html);
    },
}