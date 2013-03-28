!function($, undefined) {
  var dom = $("<p>test <b>bold <i>bolditalic</b> italic</i></p>")[0],
  out = []

  // It's a text node
  function SelectedNode(element, childIndex, offset){
    this.element = element
    this.childIndex = childIndex
    this.offset = offset
  }

  function normalize(string){
    if(string[0])
      return string.toLowerCase()
  }

  function traverse(dom, out, parent){
    if(dom.nodeType === 3){
      out.push([undefined, dom.textContent, undefined, parent])
    } else {
      var children = dom.childNodes,
      l = children.length,
      i = 0,
      outChildren = [],
      attributes = {
        "class": normalize(dom.className),
        "id":  normalize(dom.id)
      }

      out.push([normalize(dom.tagName), outChildren, attributes, parent])
      for(; i < l; i++){
        traverse(children[i], outChildren, dom)
      }
    }
  }
  traverse(dom, out)
  console.log(out);
}(jQuery);
