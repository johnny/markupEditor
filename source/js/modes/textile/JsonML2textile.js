!function($, undefined) {
  Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  }

  function TextileBuilder(){
    this.out = ''
    this.lazyTags = []
    this.currentTags = []
  }

  TextileBuilder.prototype = {
    delimiters : {
      b: '*',
      i: '_',
      del: '-',
      u: '+'
    },
    toText : function (ml) {
      this.consume(ml)
      return this.out
    },
    consume: function (ml, validTags){
      var l = ml.length,
      i = 0

      for(; i < l; i++){
        var token = ml[i]
        if(typeof token === "string"){
          if(!validTags || validTags.indexOf('text') >= 0)
            this.pushString(token)
        }
        else if(!validTags || validTags.indexOf(token[0]) >= 0)
          this.pushTag(token)
        this.lastToken = token
      }
    },
    pushString: function (string) {
      if(this.lazyTags[0] && !/^ *$/.test(string)){
        this.closeTags('lazyTags')
        this.out += " "
      }

      this.out += string
    },
    pushTag: function (ml) {
      var tag = ml[0]
      if(this.delimiters[tag]){
        var i = this.lazyTags.indexOf(tag)
        if(i >= 0)
          this.lazyTags.remove(i)
        else
          this.out += " " + this.delimiters[tag]
        this.currentTags.push(tag)
      }

      this[this.getMethod(tag)].apply(this, ml)

      if(this.delimiters[tag]){
        this.lazyTags.push(tag)
        this.currentTags.remove(this.currentTags.indexOf(tag))
      }
    },
    closeTags: function (name, keepTags) {
      var tags = this[name],
      l = tags.length,
      i = 0

      for(; i < l; i++)
        this.out += this.delimiters[tags[i]]
      
      if(!keepTags)
        this[name] = []
    },
    openTags: function (tags) {
      var l = tags.length,
      i = 0

      this.ensureSpace()
      for(; i < l; i++)
        this.out += this.delimiters[tags[i]]
    },
    methods: {
      a: 'link',
      img: 'image',
      br: 'newLine',
      ul: 'list',
      ol: 'list',
      li: 'listItem'
    },
    getMethod: function (tag){
      if(/p|h[1-6]/.test(tag))
        return "block"
      return this.methods[tag] || 'consumeChildren'
    },
    consumeChildren: function (tag, children, attributes){
      this.consume(children)
    },
    ensureSpace: function () {
      if(!/( |\n)$/.test(this.out))
        this.out += " "
    },
    link: function (tag, children, attributes) {
      this.ensureSpace()
      if(children[0][0] == 'img')
        this.consume(children, ['img'])
      else {
        this.out += "\""
        this.consume(children, ['b','i','text'])
        this.out += "\""
      }
      if(/ /.test(attributes.href))
        this.out += ":\"" + attributes.href + "\""
      else
        this.out += ":" + attributes.href
    },
    image: function (tag, children, attributes) {
      this.out += '!' + attributes.src
      if(attributes.title)
        this.out += '(' + attributes.title + ')'
      this.out += '!'
    },
    newLine: function (tag) {
      if(this.listType || this.lastToken && this.lastToken[0] === 'br' ){
        if(!this.currentTags[0]) // check if the line starts with a delimiter
          this.ensureSpace()
        this.out += "</br> "
      }
      else {
        this.closeTags('lazyTags')
        this.closeTags('currentTags', true)
        this.out += "\n"
        this.openTags(this.currentTags)
      }
    },
    list: function (tag, children, attributes) {
      this.listType = tag
      this.consume(children, ['li'])
      this.out += "\n"
      this.listType = undefined
    },
    listItem: function (tag, children, attributes) {
      this.out += this.listType == 'ul' ? '* ' : '# '
      this.consume(children)
      this.closeTags('lazyTags')
      this.closeTags('currentTags')
      this.out += "\n"
    },
    block: function (tag, children, attributes){
      if(attributes && attributes["class"])
        this.out += tag + '(' + attributes["class"] + '). '
      else
        this.out += tag == 'p' ? '' : tag + '. '

      this.consume(children)
      this.closeTags('lazyTags')
      this.closeTags('currentTags')
      this.out += "\n\n"
    }
  }
  var ml = [
    ['p', ['bla', ['b', [ 'bold', ['i',['bolditalic']]]], ['i', ['italic', ['br'], ['br'], 'italic2']], 'normal', ['br'], ['br']], {"class": "left"}],
    ['h1', ['bla', ['a', 'link', {href: 'uri'}]]],
    ['p', [['a', [['img', null ,{src: "src", title: 'test'}]], {href: 'uri with space'}]]],
    ['ul', [['li', ['test', ['b', ['bold in list']]]], ['li', ['normal in', ['br'], 'list']]]],
    ['ol', [['li', ['test', ['b', ['bold in list']]]], ['li', ['normal in list']]]]
  ],
  builder = new TextileBuilder()

  console.log('toText', builder.toText(ml));
}(jQuery);
