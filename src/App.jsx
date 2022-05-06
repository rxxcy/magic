import React, { Component } from 'react'
import './App.css'
import { Input, Button, Divider, Image as AImage, message as AMessage } from 'antd'
import sjcl from 'sjcl'
import { encodeMessage, decodeMessage } from './utils'

export default class App extends Component {

  constructor(props) {
    super(props)
    this.canvas = null
    this.preview = null
    this.maxMessageSize = 3150
    this.state = {
      preview: '',
      finish: false,
      text: null,
      entext: '',
      password: '',
      output: null
    }
  }

  init() {
    this.setState({
      finish: false,
      text: null,
      password: '',
      output: null
    })
  }

  modelTaget(e, tag) {
    const { value } = e.target
    this.setState({
      [tag]: value
    })
  }

  handlerCopyText(text) {

  }

  decode() {
    const ctx = this.canvas.getContext('2d')
    const { password } = this.state
    const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    const enPwd = sjcl.hash.sha256.hash(password)
    const message = decodeMessage(imgData.data, enPwd, this.maxMessageSize)
    if (message.length == 0) return null
    let obj = null
    try {
      obj = JSON.parse(message)
    } catch (e) {
      if (password.length > 0) AMessage.error('密码不正确或图片里面什么都没有 0x0')
      return false
    }
    if (obj.ct) {
      try {
        obj.text = sjcl.decrypt(password, message)
      } catch (e) {
        AMessage.error('密码不正确或图片里面什么都没有 0x1')
        return false
      }
    }
    return obj
  }

  handlerChangeFile(e) {
    this.init()
    const ctx = this.canvas.getContext('2d')
    const reader = new FileReader()

    reader.onload = event => {
      this.setState({
        preview: event.target.result
      })
      const img = new Image()
      img.onload = () => {
        ctx.canvas.width = img.width
        ctx.canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const content = this.decode()
        if (content === null) {
          /**
           * 里面什么都没有
           */
          this.setState({
            finish: true
          })
          return false
        }
        this.setState({
          text: content.text
        })
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(e.target.files[0])
  }

  handlerDecodeWithPassword() {
    if (!this.state.password || this.state.password.length <= 0) {
      AMessage.error('输入密码')
      return
    }

    const content = this.decode()
    if (!content) {
      AMessage.error('图片里什么都没有,或者密码错误')
      return
    }
    this.setState({
      text: content.text
    })
  }

  handlerEncode() {
    if (!this.state.entext || this.state.entext.length <= 0) {
      AMessage.error('写点什么才能写入啊')
      return
    }
    // console.log(this.state)
    const ctx = this.canvas.getContext('2d')
    let message
    if (this.state.password.length > 0) {
      message = sjcl.encrypt(this.state.password, this.state.entext)
    } else {
      message = JSON.stringify({ 'text': this.state.entext })
    }
    const pixelCount = ctx.canvas.width * ctx.canvas.height
    if ((message.length + 1) * 16 > pixelCount * 4 * 0.75) {
      AMessage.error('对于这张图片来说密文太长了')
      return
    }

    const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    encodeMessage(imgData.data, sjcl.hash.sha256.hash(this.state.password), message)
    ctx.putImageData(imgData, 0, 0)

    AMessage.success('完成!自行保存图片')
    const src = this.canvas.toDataURL()
    this.setState({
      output: src
    })
  }

  render() {
    return (
      <div className="container">

        <div className="choose">
          <Button>
            <span>选图</span>
            <input onChange={(e) => this.handlerChangeFile(e)} type="file" />
          </Button>
        </div>

        {
          this.state.preview ? (
            <div>
              {/* <Image className="preview" ref={e => this.preview = e} style={{ display: this.state.previewDisplay }} /> */}
              <AImage className="preview" src={this.state.preview} />
            </div>
          ) : ''
        }

        {
          this.state.text ? (
            <div className="result">
              <Divider orientation="left" plain>
                图片里面的秘密
              </Divider>
              {this.state.text}
            </div>
          ) : ''
        }

        {
          this.state.finish ? (
            <div className="next">
              <div className="de">
                <Divider orientation="left" plain>
                  解密
                </Divider>
                <div className="password">
                  <Input.Password allowClear onChange={e => this.modelTaget(e, 'password')} placeholder="如果有密码,在这里输入" />
                </div>
                <Button onClick={() => this.handlerDecodeWithPassword()}>读取</Button>
              </div>
              <div className="en">
                <Divider orientation="left" plain>
                  加密
                </Divider>
                <div className="password">
                  <Input.Password allowClear onChange={e => this.modelTaget(e, 'password')} placeholder="如果要加密码,在这里输入" />
                </div>

                <div className="password">
                  <Input.TextArea showCount allowClear maxLength={this.maxMessageSize} onChange={e => this.modelTaget(e, 'entext')} placeholder="想写点什么" />
                </div>
                <Button onClick={() => this.handlerEncode()}>写入</Button>
              </div>
            </div>
          ) : ''
        }

        {
          this.state.output ? (
            <div className="output">
              <Divider orientation="left" plain>
                加密后的图片
              </Divider>
              <img className="preview" src={this.state.output} />
            </div>
          ) : ''
        }

        <canvas style={{ display: 'none' }} ref={e => this.canvas = e}></canvas>
      </div>
    )
  }
}
