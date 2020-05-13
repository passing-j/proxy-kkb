// 原始=>响应式
let toProxy = new WeakMap()
// 响应式=>原始
let toRaw = new WeakMap()

let effectStack = []
let targetMap = new WeakMap()  // 特殊的 {}  key 是 object
// obj.name
// {
//     target: deps: {}
// }
// 以上 存储依赖关系
function track() {
    // 收集依赖

}

function trigger() {
    // 触发更新
}

function effect() {

}
let obj = {name: 'kkb'}  // 背后有个 proxy 监听
// obj.name  触发 get 函数

// 响应式代理
const baseHandler = {
    get(target, key) {
        // 收集依赖
        // @todo
        // return target[key]
        const res = Reflect.get(target, key)
        return typeof res == 'object' ? reactive(res) : res
    },
    set(target, key, val) {
        // Object.name ==xx 这里 我们是需要通知更新的
        const res = Reflec.set(target, key, val)
        // 触发更新
        // @todo
        return res
    }
}
function reactive(target) {
    // 查询缓存
    let observed = toProxy.get(target)
    if (observed) {
        return observed
    }
    if (toRaw.get(target)) {
        return target
    }

    observed = new Proxy(target, baseHandle)

    toProxy.set(target, observed)
}