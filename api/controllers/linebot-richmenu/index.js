'use strict';

const config = {
  channelAccessToken: '【チャネルアクセストークン（長期）】',
  channelSecret: '【チャネルシークレット】',
};

const HELPER_BASE = process.env.HELPER_BASE || '../../helpers/';
const Response = require(HELPER_BASE + 'response');
const BinResponse = require(HELPER_BASE + 'binresponse');

const LineUtils = require(HELPER_BASE + 'line-utils');
const line = require('@line/bot-sdk');
const app = new LineUtils(line, config);

const streams = require('memory-streams');
const filetype = require('file-type');

exports.handler = async (event, context, callback) => {
  if( event.path == '/linebot-richmenu-upload' ){
    var body = JSON.parse(event.body);
    
    var menu_id = await app.client.createRichMenu(body.object);
    await app.client.setRichMenuImage(menu_id, Buffer.from(body.image, 'base64'));

    return new Response({ richMenuId: menu_id });
  }else
  if( event.path == '/linebot-richmenu-list' ){
    var list = await app.client.getRichMenuList();
    console.log(list);
    return new Response( { list: list });
  }else
  if( event.path == '/linebot-richmenu-image' ){
    var param = event.queryStringParameters;
    console.log(param);

    var reader = await app.client.getRichMenuImage(param.menu_id);
    var writer = new streams.WritableStream();
    return new Promise((resolve, reject) =>{
      reader.on('error', (error) =>{
        console.error(error);
        reject(error);
      });
      reader.on('readable', () =>{
        var buffer = reader.read();
        if( buffer )
          writer.write(buffer);
      });
      reader.on('end', async () =>{
        var buffer = writer.toBuffer();
        var type = await filetype.fromBuffer(buffer);
        resolve(new BinResponse(type.mime, buffer));
      });
    });
  }else
  if( event.path == '/linebot-richmenu-get' ){
    var body = JSON.parse(event.body);
    var menu = await app.client.getRichMenu(body.menu_id);
    return new Response(menu);
  }else
  if( event.path == '/linebot-richmenu-delete' ){
    var body = JSON.parse(event.body);
    await app.client.deleteRichMenu(body.menu_id);
    return new Response({});
  }else
  if( event.path == '/linebot-richmenu-set-default' ){
    var body = JSON.parse(event.body);
    await app.client.setDefaultRichMenu(body.menu_id);
    return new Response({});
  }else
  if( event.path == '/linebot-richmenu-get-default' ){
    var menu_id = await app.client.getDefaultRichMenuId();
    return new Response({ menu_id: menu_id });
  }
};
