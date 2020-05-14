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
function track(target,key){
  // 收集依赖
  // 最后一个 就是最新的
  const effect = effectStack[effectStack.length-1]
  // 最新的effect
  if(effect){
    let depMap = targetMap.get(target)
    if(depMap===undefined){
      depMap = new Map()
      targetMap.set(target,depMap)
    }
    let dep = depMap.get(key) // obj.count  target是obj，key是count
    if(dep==undefined){
      dep = new Set()
      depMap.set(key, dep)
    }
    // 双向存储无处不在，优化的原则
    if(!dep.has(effect)){
      dep.add(effect)
      effect.deps.push(dep)
    }
  }
}

function trigger(target, key, info) {
    // 触发更新
    // 寻找依赖effect
    const depMap = targetMap.get(target)
    if (depMap === undefined) {
        // 没有依赖
        return
    }
    const effects = new Set()
    const computedRunners = new Set()

    if (key) {
        let deps = depMap.get(key)
        // deps里面全部是 effect
        deps.forEach(effect => {
            if (effect.computed) {
                computedRunners.add(effect)
            } else {
                effects.add(effect)
            }
        })
    }
    effects.forEach(effect => effect())
    computedRunners.forEach(computed => computed())
}

function effect(fn, options = {}) {
  // 其实就是往effectStackpush了一个effect函数，执行fn
  // @todo 处理options
  let e = createReactiveEffect(fn, options);

  if (!options.lazy) {
    e();
  }

  return e;
}
function createReactiveEffect(fn, options) {
  // 构造effect
  const effect = function effect(...args) {
    return run(effect, fn, args);
  };
  effect.deps = [];
  effect.computed = options.computed;
  effect.lazy = options.lazy;
  return effect;
}
function run(effect, fn, args) {
    if (effectStack.indexOf(effect) === -1) {
        try {
            effectStack.push(effect)
            return fn(...args) //执行
        } finally {
            effectStack.pop() // effect 用完就要推出去
        }
    }
}
function computed(fn) {
    // 特殊的 effect
    const runner = effect(fn, {computed: true, lazy: true})
    return  {
        effect: runner,
        get value() {
            return runner()
        }
    }
}
// let obj = {name: 'kkb'}  // 背后有个 proxy 监听
// obj.name  触发 get 函数

// 响应式代理
const baseHandler = {
    get(target, key) {
        // target 就是 obj, key 就是 name
        // 收集依赖
        // @todo
        // return target[key]
        const res = Reflect.get(target, key)
        track(target, key)
        return typeof res == 'object' ? reactive(res) : res
    },
    set(target, key, val) {
        const info = {oldValue: target[key], newValue: val}
        // Object.name ==xx 这里 我们是需要通知更新的
        const res = Reflect.set(target, key, val)
        // 触发更新
        trigger(target, key, info)
        return res
    }
}
// 响应式
function reactive(target) {
    // 查询缓存
    let observed = toProxy.get(target)
    if (observed) {
        return observed
    }
    if (toRaw.get(target)) {
        return target
    }

    observed = new Proxy(target, baseHandler)

    toProxy.set(target, observed)
    toRaw.set(observed, target)
    return observed
}
