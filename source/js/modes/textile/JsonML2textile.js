!function($) {
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
      i: '_'
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
      }
    },
    pushString: function (string) {
      if(this.lazyTags[0] && !/^ *$/.test(string)){
        this.closeLazyTags()
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
    closeLazyTags: function () {
      this.closeTags(this.lazyTags)
      this.lazyTags = []
    },
    closeTags: function (tags) {
      var l = tags.length,
      i = 0

      for(; i < l; i++)
        this.out += this.delimiters[tags[i]]
    },
    openTags: function (tags) {
      var l = tags.length,
      i = 0

      this.ensureSpace()
      for(; i < l; i++)
        this.out += this.delimiters[tags[i]]
    },
    getMethod: function (tag){
      if(/p|h[1-6]/.test(tag))
        return "block"
      else if(/a/.test(tag))
        return 'link'
      else if(tag == 'img')
        return 'image'
      else if(tag == 'br')
        return 'newLine'
      else
        return "consumeChildren"
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
      this.out += ":" + attributes.href
    },
    image: function (tag, children, attributes) {
      this.out += '!' + attributes.src + '!'
    },
    newLine: function (tag) {
      this.closeLazyTags()
      this.closeTags(this.currentTags)
      this.out += "\n"
      this.openTags(this.currentTags)
    },
    block: function (tag, children, attributes){
      if(attributes && attributes["class"])
        this.out += tag + '(' + attributes["class"] + '). '
      else
        this.out += tag == 'p' ? '' : tag + '. '

      this.consume(children)
      this.out += "\n\n"
    }
  }
  var ml = [
    ['p', ['bla', ['b', [ 'bold', ['i',['bolditalic']]]], ['i', ['italic', ['br'], 'italic2']], 'normal'], {"class": "left"}],
    ['p', ['bla', ['a', 'link', {href: 'uri'}]]],
    ['p', [['a', [['img', null ,{src: "src"}]], {href: 'uri'}]]]
  ],
  builder = new TextileBuilder()

  console.log('toText', builder.toText(ml));
}(jQuery);
