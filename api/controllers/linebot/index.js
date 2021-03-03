'use strict';

const config = {
  channelAccessToken: '【チャネルアクセストークン（長期）】',
  channelSecret: '【チャネルシークレット】',
};

const richmenu_id = '【リッチメニューID】';

const HELPER_BASE = process.env.HELPER_BASE || '../../helpers/';

const LineUtils = require(HELPER_BASE + 'line-utils');
const line = require('@line/bot-sdk');
const app = new LineUtils(line, config);

app.client.setDefaultRichMenu(richmenu_id);

app.follow(async (event, client) =>{
//  await client.linkRichMenuToUser(event.source.userId, richmenu_id);
});

app.message(async (event, client) =>{
  var message = app.createSimpleResponse("こんにちは。「" + event.message.text + "」ですね");
  return client.replyMessage(event.replyToken, message);
});

app.postback(async (event, client) =>{
  var text;
  if( event.postback.params && event.postback.params.datetime )
    text = "「" + event.postback.data + " : " + event.postback.params.datetime + "」ですね";
  else
    text = "「" + event.postback.data + "」ですね";
  var message = message = app.createSimpleResponse(text);
  return client.replyMessage(event.replyToken, message);
})

exports.fulfillment = app.lambda();
