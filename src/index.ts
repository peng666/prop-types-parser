import {
    ParserConfig
} from '../types/config'
import parse from './lib/parse'
import parseSeries from './lib/parseSeries'
// const config: ParserConfig = {
//     base: '/Users/anchao01/code/erp-comp-helper/node_modules/@befe/erp-comps/v2/components/',
//     fileExtension: 'js',
//     components: [
//         ['Section', {
//             location: '/Users/anchao01/code/erp-comp-helper/node_modules/@befe/erp-comps/v2/components/Section/Container.js'
//         }],
//         ['Avatar'],
//         ['Button', {
//             location: './Button'
//         }],
//         ['Select', {
//             location: '/Users/anchao01/code/erp-comp-helper/node_modules/@befe/erp-comps/v2/components/Select/Generic.js'
//         }]
//     ]
// }
// parse('/Users/anchao01/code/erp-comp-helper/node_modules/@befe/erp-comps/v2/components/Button/index.js')
// console.log(parseSeries(config))
export default parse
parse('/Users/anchao01/code/erp-comp-helper/node_modules/@befe/erp-comps/v2/components/Select/Generic.js')
