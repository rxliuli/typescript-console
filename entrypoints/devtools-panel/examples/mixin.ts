import { add as add1 } from 'es-toolkit/compat'
import * as _ from 'es-toolkit/compat'
import add2 from 'es-toolkit/compat/add'

console.log(_.add(1, 2), add1(1, 2), add2(1, 2))
