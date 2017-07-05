const {
  createWriteStream,
  writeFileSync
} = require('fs');
const fs = require('fs');
const {
  Wechaty,
  Room,
  MediaMessage
} = require('wechaty');
const path = require('path');

const LISTEN = [];
const GROUPS = ['test1', 'test2'];
const CACHE_DIR = 'cache';

Wechaty.instance()
  .on('scan', (url, code) => {
    let loginUrl = url.replace('qrcode', 'l');
    require('qrcode-terminal').generate(loginUrl);
    console.log(url)
  })

  .on('login', user => {
    console.log(`${user} login`)
  })


  .on('message', function (m) {
    const contact = m.from();
    const content = m.content();
    const room = m.room();

    console.log(' ===== ');
    console.log(contact);
    console.log(' ===== ');

    if (room) {
      //若为机器人的消息，即转发它人的消息，则不再重复发送，（机器人只做转发，自己不说话）
      if (m.self()) {
        return
      }

      //saveRawObj(m.rawObj) //保存json

      //对于机器人来说，设置显示的名称：群昵称>微信昵称/名
      let name = "";
      if (room.alias(contact) !== null) {
        name = room.alias(contact)
      } else if (contact.name() !== null) {
        name = contact.name()
      } else if (contact.alias() !== null) {
        name = contact.alias()
      } else {
        name = ""
      }
      console.log(`Room: ${room.topic()} Contact: ${name} Content: ${content}`)
      //在此处设置需要进行信息同步直播的群的群名字-----begin
      let myRooms = [];
      GROUPS.map(group => {
        myRooms.push(group);
      });

      //在此处设置需要进行信息同步直播的群的群名字-----end
      for (let item in myRooms) {
        if (myRooms[item] == room.topic()) {
          for (var roomItem in myRooms) {
            //同步给本群以外的其他群
            if (myRooms[item] == myRooms[roomItem]) continue;
            Room.find({
              topic: myRooms[roomItem]
            }).then(async function (keyroom) {
              if (keyroom) {
                keyroom.say = console.log;
                
                //屏蔽系统消息
                if (m.type() === 9999 || m.type() === 10000) {
                  return
                } else
                  //屏蔽语音、名片、视频
                  if (m.type() === 34 || m.type() === 42 || m.type() === 43) {
                    return
                  }
                //处理位置共享
                if (m.type() === 1 && content.indexOf("Initiated location sharing&#44") >= 0) {
                  return
                }
                //处理部分emoji表情
                if (m.type() === 1 && content.indexOf("class=\"emoji") >= 0 && content.indexOf("text=\"_web\"") >= 0) {
                  return
                }
                //处理emoji表情
                if (m.type() === 1 && content.indexOf("emoji&#44") >= 0) {
                  return
                }

                if (m.type() === 1) {
                  if (m.typeSub() === 48) { //处理位置信息
                    keyroom.say(`[${name}]from[${room.topic()}]：共享位置信息:` + content.substring(0, content.indexOf(":<br/>")))
                    keyroom.say(m)
                  } else {
                    keyroom.say(`[${name}]from[${room.topic()}]：${content}`)
                  }
                } else if (m.type() === 3) { // 处理图片信息
                  mkdir(`./${CACHE_DIR}/`);
                  await saveMediaFile(m);
                  save(function() {
                    dksfjdsklf
                  });
                  console.log('图片地址');
                  console.log(`${CACHE_DIR}/${m.filename()}`);
                  keyroom.say(new MediaMessage(`${CACHE_DIR}/${m.filename()}`));
                } else if (m.type() === 49 && m.typeApp() === 5) { //URL公众号文章分享
                  keyroom.say(`[${name}]from[${room.topic()}]：` + content.substring(content.indexOf("&lt;title&gt;") + 13, content.indexOf("&lt;/title&gt;")) + content.substring(content.indexOf("&lt;url&gt;") + 11, content.indexOf("&lt;/url&gt;")))
                } else if (m.type() === 49 && m.typeApp() === 6) { //保存文件：Word，Excel等
                  keyroom.say(`[${name}]from[${room.topic()}]：【发送了文件，暂时无法同步！】`);
                  mkdir(`./${CACHE_DIR}/`);
                  await saveMediaFile(m);
                  return;
                } else {
                  keyroom.say(`from[${room.topic()}]群里的[${name}]说：`);
                  keyroom.say(m)
                }
              }
            })
          }
        }
      }
    } else {
      console.log(`Contact: ${contact.name()} Content: ${content}`)
    }

  })
  .init()
  .catch(e => console.error('bot.init() error: ' + e));

async function saveMediaFile(message) {
  return new Promise((resolve, reject) => {
      const filename = message.filename();
      console.log('local filename: ' + filename);

      const fileStream = createWriteStream(`${CACHE_DIR}/${filename}`);

      console.log('start to readyStream()');
      message.readyStream()
          .then(stream => {
              stream.pipe(fileStream)
                  .on('close', () => {
                      resolve('finish readyStream()')
                  })
          })
          .catch(e => reject('stream error:' + e))
  });
}

function saveRawObj(o) {
  writeFileSync('rawObj.log', JSON.stringify(o, null, '  ') + '\n\n\n', {
    flag: 'a'
  })
}

//使用时第二个参数可以忽略
function mkdir(dirpath, dirname) {
  //判断是否是第一次调用
  if (typeof dirname === "undefined") {
    if (fs.existsSync(dirpath)) {
      return;
    } else {
      mkdir(dirpath, path.dirname(dirpath));
    }
  } else {
    //判断第二个参数是否正常，避免调用时传入错误参数
    if (dirname !== path.dirname(dirpath)) {
      mkdir(dirpath);
      return;
    }
    if (fs.existsSync(dirname)) {
      fs.mkdirSync(dirpath)
    } else {
      mkdir(dirname, path.dirname(dirname));
      fs.mkdirSync(dirpath);
    }
  }
}