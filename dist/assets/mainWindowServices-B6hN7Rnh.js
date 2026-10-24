import {a as e, r as t} from "./index-jkpn2Q5y.js";
import {a as n} from "./cacheManager-DeLgB0kd.js";
import {O as r} from "./queryCache--A5lm83H.js";
function i() {
    return typeof window > `u` ? () => {}
    : window.linerElectron?.onBundleStamp?.(t => e(`gray`, `bundle`, t)) ?? ( () => {}
    )
}
function a() {
    t(),
    n(),
    r(),
    i()
}
export {a as initMainWindowServices};
