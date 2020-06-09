var http = require("http");
var fs = require("fs");
const puppeteer = require('puppeteer');

var furl = 'http://www.pufei8.com/manhua/419/'
async function getWelfareImage (url) {
    // 返回解析为Promise的浏览器
    const browser = await puppeteer.launch({headless:false})
    // 返回新的页面对象
// ---------------------------------------------------------------------
    const page = await browser.newPage()
    // 页面对象访问对应的url地址
    await page.goto(url, {
        waitUntil: 'networkidle2'
    })
    
    // 等待1000ms，等待浏览器的加载
    await sleep(1000)
  
    // 可以在page.evaluate的回调函数中访问浏览器对象，可以进行DOM操作
    const links = await page.evaluate(() => {
        // 获取漫画列表节点
        let list = document.getElementById('play_0')
        // 获取漫画集节点
        let links = list.getElementsByTagName('a')
        let arr = []
        for(let link of links){
            // 把漫画集的连接地址添加到数组中
            arr.push(link.href)
        }
        return arr
    });  
    // for of 循环数组，返回的是数组值，for in 循环数组，返回的是数组的键值0-n
    for(let temp of links) {
        // ---------------------------------------------------------------------
        // 跳转页面至连接地址
        await page.goto(temp, {
            waitUntil: 'networkidle2'
        })
        // 等待500ms，等待浏览器的加载
        await sleep(500)
        let pages = await page.evaluate(() => {
            // 找到当前漫画集的总页数
            let pageCount = document.getElementsByTagName('option').length/2;
            return pageCount  
        })
        // 在总页数内循环拼接连接参数，参数为1-pages，并下载漫画图片
        for (let i = 1; i < pages+1; i++) {
            // 进入拼接连接
            await page.goto(temp+'?page='+i)
            await sleep(500)
            const urls = await page.evaluate(() => {
                // 获取图片节点
                let imgs = document.getElementById('viewimg')
                let imgScr = imgs.getAttribute("src")
                // 返回标题作为文件名
                let titel = document.getElementsByTagName('h1')[0].innerText
                // 返回所有漫画的url地址数组
                return {imgScr:imgScr,titel:titel}
            });
            // 下载页面中的图片
            downLoad(urls);
        }
        // ---------------------------------------------------------------------
    }
    // 关闭无头浏览器
    await browser.close();
}
// 设置浏览器等待缓存时间
async function sleep(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}
// 封装下载功能
function downLoad(url) {
    // 使用get方式，访问连接，根据目标网站的协议引入http/https协议
    http.get(url.imgScr, function(res){
        var imgData = "";
        // 拼接保存图片的路径
        let filePath =  './img/'+(url.titel)+'.jpg';
         //一定要设置response的编码为binary否则会下载下来的图片打不开
        res.setEncoding("binary");
        res.on("data", function(chunk){
            imgData+=chunk;
        });
        // 判断文件是否写入成功
        res.on("end", function(){
            // return false;
            fs.writeFile(filePath, imgData, "binary", function(err){
                if(err){
                    console.log("down fail");
                }else{
                    console.log("down success"+url.titel);
                }
            });
        });
    });
}
// 执行整个app.js功能
getWelfareImage(furl);