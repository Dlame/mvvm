// 因为遍历解析的过程有多次操作dom节点，为提高性能和效率
// 先将vue实例根节点的 el 转换成文档碎片 fragment 进行解析编译操作
// 解析完成，再将 fragment 添加回原来的真实dom节点中
function Compile(el) {
	this.$el = this.isElementNode(el) ? el : document.querySelector(el);
	if (this.$el) {
		this.$fragment = this.node2Fragment(this.$el);
		this.init();
		this.$el.appendChild(this.$fragment);
	}
}

Compile.prototype = {
	init: function () {
		this.compileElement(this.$fragment);
	},
	node2Fragment: function (el) {
		var fragment = document.createDocumentFragment(),
			child;
		// 将原生节点拷贝到fragment
		while ((child = el.firstChild)) {
			fragment.appendChild(child);
		}
		return fragment;
	},
	// compileElement方法将遍历所有节点及其子节点，进行扫描解析编译，
	// 调用对应的指令渲染函数进行数据渲染，并调用对应的指令更新函数进行绑定
	compileElement: function (el) {
		var childNodes = el.childNodes,
      me = this;
    [].splice.call(childNodes).forEach(function(node){
      
    })
	}
};
