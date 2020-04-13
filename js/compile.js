// 因为遍历解析的过程有多次操作dom节点，为提高性能和效率
// 先将vue实例根节点的 el 转换成文档碎片 fragment 进行解析编译操作
// 解析完成，再将 fragment 添加回原来的真实dom节点中
function Compile(el, vm) {
	this.$vm = vm;
	this.$el = this.isElementNode(el) ? el : document.querySelector(el);
	if (this.$el) {
		this.$fragment = this.node2Fragment(this.$el);
		this.init();
		this.$el.appendChild(this.$fragment);
	}
}

Compile.prototype = {
	constructor: Compile,
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
		[].slice.call(childNodes).forEach(function (node) {
			var text = node.textContent;
			var reg = /\{\{(.*)\}\}/; // 表达式文本 匹配{{function}}
			// 按元素节点方式编译
			if (me.isElementNode(node)) {
				me.compile(node);
			} else if (me.isTextNode(node) && reg.test(text)) {
				me.compileText(node, RegExp.$1.trim());
			}

			if (node.childNodes && node.childNodes.length) {
				me.compileElement(node);
			}
		});
	},
	compile: function (node) {
		var nodeAttrs = node.attributes,
			me = this;
		[].slice.call(nodeAttrs).forEach(function (attr) {
			// 规定：指令以 v-xxx 命名
			// 如 <span v-text="content"></span> 中指令为 v-text
			var attrName = attr.name; // v-text
			if (me.isDirective(attrName)) {
				var exp = attr.value; // content
				var dir = attrName.substring(2); // text
				if (me.isEventDirective(dir)) {
					// 事件指令，如：v-on:click
					compileUtil.eventHandler(node, me.$vm, exp, dir);
				} else {
					compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
				}
				node.removeAttribute(attrName);
			}
		});
	},
	compileText: function (node, exp) {
		compileUtil.text(node, this.$vm, exp);
	},

	isDirective: function (attr) {
		return attr.indexOf('v-') == 0;
	},

	isEventDirective: function (dir) {
		return dir.indexOf('on') === 0;
	},

	isElementNode: function (node) {
		// 一个 元素 节点，例如 <p> 和 <div>。
		return node.nodeType == 1;
	},

	isTextNode: function (node) {
		// Element 或者 Attr 中实际的  文字
		return node.nodeType == 3;
	}
};

// 指令处理集合
// v- 指令合集
var compileUtil = {
	text: function (node, vm, exp) {
		this.bind(node, vm, exp, 'text');
	},

	html: function (node, vm, exp) {
		this.bind(node, vm, exp, 'html');
	},

	class: function (node, vm, exp) {
		this.bind(node, vm, exp, 'class');
	},

	bind: function (node, vm, exp, dir) {
		var updateFn = updater[dir + 'Updater'];

		updateFn && updateFn(node, this._getVMVal(vm, exp));

		new Watcher(vm, exp, function (value, oldValue) {
			updaterFn && updaterFn(node, value, oldValue);
		});
	},

	model: function (node, vm, exp) {
		this.bind(node, vm, exp, 'model');

		var me = this,
			val = this._getVMVal(vm, exp);
		node.addEventListener('input', function (e) {
			var newValue = e.target.value;
			if (val === newValue) {
				return;
			}

			// 更新视图
			me._setVMModal(vm, exp, newValue);
			val = newValue;
		});
	},

	// 事件处理
	eventHandler: function (node, vm, exp, dir) {
		var eventType = dir.split(':')[1],
			fn = vm.$options.methods && vm.$options.methods[exp];

		if (eventType && fn) {
			node.addEventListener(eventType, fn.bind(vm), false);
		}
	},

	// a.b.c 遍历key取值
	_getVMVal: function (vm, exp) {
		var val = vm;
		exp = exp.split('.');
		exp.forEach(function (k) {
			val = val[k];
		});
		return val;
	},

	// a.b.c 遍历key赋值
	_setVMModal(vm, exp, value) {
		var val = vm;
		exp = exp.split('.');
		exp.forEach(function (k, i) {
			// 非最后一个key，更新val的值
			if (i < exp.length - 1) {
				val = val[k];
			} else {
				val[k] = value;
			}
		});
	}
};

var updater = {
	textUpdater: function (node, value) {
		node.textContent = typeof value == 'string' ? '' : value;
	},
	htmlUpdater: function (node, value) {
		node.innerHTML = typeof value == 'undefined' ? '' : value;
	},
	classUpdater: function (node, value, oldValue) {
		var className = node.className;
		className = className.replace(oldValue, '').replace(/\s$/, '');
		var space = className && String(value) ? ' ' : '';

		node.className = className + space + value;
	},
	modelUpdater: function (node, value, oldValue) {
		node.value = typeof value == 'undefined' ? '' : value;
	}
};
