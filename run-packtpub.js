#!/bin/env node

var TelegramBot = require('node-telegram-bot-api');
var request     = require('request');
var cheerio     = require('cheerio');
var CronJob     = require('cron').CronJob;

var token = process.env.TGPACKTPUBTOKEN || '';
var bot   = new TelegramBot(token, {polling: true});

function scrapPacktpub(msg) {
  var sendTo = (msg == null ? process.env.TGIDDEVABS : msg.chat.id);   //Dev@AbS
  var url    = 'https://www.packtpub.com/packt/offers/free-learning';

  request(url, function(error, response, html) {
    if(!error) {
      var $ = cheerio.load(html);

      var cover, title, details, nid1, nid2;  //link
      cover   = $("div[class='dotd-main-book-image float-left'] a img").attr("src");
      title   = $("div[class='dotd-title'] h2").text().trim();
      //link    = $("div[class='float-left free-ebook'] a").attr("href");
      nid1 = $("input#free-learning-register-claim-title-nid").attr("value");
      nid2 = $("input#free-learning-register-node-id").attr("value");
      details = $("div[class='dotd-main-book-image float-left'] a").attr("href");

      (function(url, sendTo, title, cover, link) {
        request(url, function(error, response, html2) {
          if(!error) {
            var $ = cheerio.load(html2);

            var dt, pages;
            dt    = $("time[itemprop='datePublished']").text().trim();
            pages = $("div.book-info-outer.second-level-info.cf span[itemprop='numberOfPages']").text().trim();

            var det = "";
            var lines = [];
            if (dt) {
              lines.push(dt);
            }
            if (pages) {
              lines.push("(" + pages + " pages)");
            }
            if (lines.length > 0) {
              det = "\n● " + lines.join(" ");
            }

            var reqcover = request("http:"+cover);

            var options = {
              caption: "● " + title + det + "\nhttps://www.packtpub.com/packt/offers/free-learning",
              parse_mode: 'HTML',
              reply_markup: JSON.stringify({
                inline_keyboard: [[{ text: "Claim Your Free eBook", url: "https://www.packtpub.com/freelearning-claim/"+nid1+"/"+nid2}]]
              })
            };
            bot.sendPhoto(sendTo, reqcover, options).then(function (sended) {
              delete options.chat_id;
              delete options.photo;
              bot.sendPhoto(process.env.TGIDGRPA, sended.photo[0].file_id, options);  //MORE GRP
            });

          }
        });
      })("https://www.packtpub.com" + details, sendTo, title, cover, link);
    }
  });
}


new CronJob('30 8 * * *', function() {
  scrapPacktpub(null);
}, null, true, 'Asia/Kuala_Lumpur');

bot.onText(/\/packtpub$/i, function (msg, m) {
  scrapPacktpub(msg);
});
