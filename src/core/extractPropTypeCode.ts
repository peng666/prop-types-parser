import {transformFromAst, transform} from 'babel-core'
import { Program, VariableDeclaration } from 'babel-types'
import findAllDependencesByObj from '../utils/findAllDependencesByObj'
import { ParserConfig } from '../../types/config'; 
import { NodePath } from 'babel-traverse'
import * as t from 'babel-types'
import * as _ from 'lodash'
import * as path from 'path'

const babelRegisterCode = `
    require('babel-register')(global.__babelConfig__)
`

/**
 * 将proptypes相关代码单独解析出来
 * @param propTypesPath 代码中propTypes定义所在的path
 */
export default function(propTypesPath: NodePath, defaultPropsPath: NodePath, cwd: string, config: ParserConfig): string {
    let programAst: Program | any = {
        type: 'Program',
        body: []
    }
    const node = propTypesPath.node
    const dependencies = _.uniq(
        findAllDependencesByObj(propTypesPath.get('value'))
        .concat(
            findAllDependencesByObj(defaultPropsPath.get('value'))
        )
    )
    resolveDepsNotJs(dependencies);
    changeImportedSource(dependencies, cwd, <object>config.alias, <object>config.resolveModule);

    if (dependencies && dependencies.length) {
        dependencies.forEach(dep => {
            programAst.body.push(dep.node);
        })
    }

    programAst.body.push(transStaticPropertyToDeclare(node, '_propTypes_'));
    programAst.body.push(transStaticPropertyToDeclare(defaultPropsPath.node, '_defaultProps_'));
    const code: string = <string>transformFromAst(programAst).code;
    return babelRegisterCode + <string>transform(code, {presets: [require('babel-preset-env'), require('babel-preset-stage-0')]}).code + 'callback && callback(_propTypes_, _defaultProps_)';
}

/**
 * 改变库的引用
 * @param dependencies require所引用的路径替换 相对到绝对, 对prop-types替换
 */
function changeImportedSource(dependencies: NodePath[], cwd: string, alias: object, resolveModule: object) {
    dependencies.forEach(dep => {
        if (t.isLiteral(dep.get('source'))) {
            const sourceName = _.get(dep, 'node.source.value')
            if (sourceName) {
                dep.get('source').replaceWith(
                    t.stringLiteral(resolveSource(sourceName, alias, resolveModule, cwd))
                )
            }
        }
    })
}

/**
 * 去除可能存在的static propTypes中的static
 * @param node 
 */
function transStaticPropertyToDeclare(node: any, name: string): VariableDeclaration{
    node.static = false

    const declaration: VariableDeclaration = t.variableDeclaration(
        'var',
        [
            t.variableDeclarator(
                t.identifier(name),
                node.value
            )
        ]
    )

    return declaration
}

/**
 * source的绝对地址
 * @param sourceName 引用模块地址
 * @param alias alias配置
 * @param resolveModule resolveModule配置
 * @param cwd 
 */
function resolveSource(sourceName: string, alias: object, resolveModule: object, cwd: string): string {
    for (let key of Object.keys(resolveModule)) {
        if (key === sourceName) {
            return resolveModule[key]
        }
    }

    return resolveAlias(sourceName, alias, cwd)
}

/**
 * 文件
 * @param filePath 文件路径
 * @param alias 文件别称配置
 * @param dirname 所在目录
 */
function resolveAlias(filePath: string, alias: any, dirname: string): string {
    if (filePath.startsWith('.')) {
        return path.join(dirname, filePath)
    }

    for (let key of Object.keys(alias)) {
        if (filePath.startsWith(`${key}${path.sep}`)) {
            return path.join(alias[key], `.${filePath.substr(key.length)}`)
        }
    }

    return filePath
}
// avoiding to import img or css file, caused by only transforming js is supported by babel
function resolveDepsNotJs(dependencies: any[]) {
    dependencies.forEach((dep: any) => {
        if (t.isImportDeclaration(dep.node)) {
            if (
                // assume it is default export
                t.isImportDefaultSpecifier(_.get(dep, 'node.specifiers.0'))
                && _.get(dep, 'node.specifiers').length === 1
                && /(\.less|\.css|\.sass|\.png|\.jpg|\.svg|\.gif)$/.test(_.get(dep, 'node.source.value'))
            ) {
                const specifierName = _.get(dep, 'node.specifiers.0.local.name');
                const source = _.get(dep, 'node.source.value');
                dep.replaceWith(
                    t.variableDeclaration(
                        'var',
                        [
                            t.variableDeclarator(
                                t.identifier(specifierName),
                                t.stringLiteral(source)
                            )
                        ]
                    )
                )
            }
        }
    }) 
}