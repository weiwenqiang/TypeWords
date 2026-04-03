import { Candidate, Question, Word } from "../types";
import { shuffle } from "../utils";

function getWordByText(val: string, list: Word[]): Word | undefined {
    let r = list.find(v => v.word.toLowerCase() === val.toLowerCase())
    return r
}

function pickRelVariant(w: Word, list: Word[]): Candidate | null {
    let rels = w.relWords?.rels || []
    for (let i = 0; i < rels.length; i++) {
        for (let j = 0; j < rels[i].words.length; j++) {
            let c = rels[i].words[j].c
            let r = getWordByText(c, list)
            if (r && r.word.toLowerCase() !== w.word.toLowerCase()) {
                return { word: r.word, wordObj: r, label: '' }
            }
        }
    }
    return null
}

function pickSynonym(w: Word, list: Word[]): Candidate | null {
    let synos = w.synos || []
    for (let i = 0; i < synos.length; i++) {
        for (let j = 0; j < synos[i].ws.length; j++) {
            let c = synos[i].ws[j]
            let r = getWordByText(c, list)
            if (r && r.word.toLowerCase() !== w.word.toLowerCase()) {
                return { word: r.word, wordObj: r, label: '' }
            }
        }
    }
    return null
}

function pickSamePos(w: Word, list: Word[]): Candidate | null {
    let pos = (w.trans?.[0]?.pos || '').trim()
    let samePos = list.filter(v => v.word.toLowerCase() !== w.word.toLowerCase() && v.trans?.some(t => t.pos === pos))
    if (samePos.length) {
        let r = samePos[Math.floor(Math.random() * samePos.length)]
        return { word: r.word, wordObj: r, label: '' }
    }
    return null
}

function formatCandidateText(c: Candidate): string {
    const w = c.wordObj
    if (!w || !w.trans || !w.trans.length) return '当前词典未收录释义'

    const cleanCn = (cn: string, head: string) => {
        let t = cn || ''
        // 去掉含英文的括号片段（避免出现人名或英文拼写）
        t = t.replace(/（[^）]*[A-Za-z][^）]*）/g, '')
        // 去掉“时态/过去式/复数”等形态说明
        t = t.replace(/(时\s*态|过去式|过去分词|现在分词|复数|第三人称|比较级|最高级)[:：].*/g, '')
        // 去掉直接出现的英文词头
        const headEsc = head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        t = t.replace(new RegExp(headEsc, 'gi'), '')
        // 统一分隔符为中文分号
        t = t.replace(/[;；]\s*/g, '；')
        // 收尾空白
        t = t.trim()
        return t
    }

    const parts = w.trans
        .map(v => {
            const pos = (v.pos || '').trim()
            const cn = cleanCn(v.cn || '', w.word)
            if (/^\s*【名】/.test(v.cn || '')) return ''
            if (!cn) return ''
            return `${pos ? '- ' + pos + ' ' : '- '}${cn}`
        })
        .filter(Boolean)

    return parts.length ? parts.join('；') : '当前词典未收录释义'
}

export function buildQuestion(w: Word, list: Word[]): Question {
    let candidates: Candidate[] = []
    candidates.push({ word: w.word, wordObj: w, label: '' })
    let c1 = pickRelVariant(w, list) || pickSynonym(w, list) || pickSamePos(w, list)
    let c2 = null as Candidate | null
    let c3 = null as Candidate | null
    let tried = new Set<string>([w.word.toLowerCase()])
    if (c1) tried.add(c1.word.toLowerCase())
    let attempts = 0
    while (!c2 && attempts < 5) {
        c2 = pickSynonym(w, list) || pickSamePos(w, list) || pickRelVariant(w, list)
        if (c2 && tried.has(c2.word.toLowerCase())) c2 = null
        attempts++
    }
    if (c2) tried.add(c2.word.toLowerCase())
    attempts = 0
    while (!c3 && attempts < 5) {
        c3 = pickSynonym(w, list) || pickSamePos(w, list) || pickRelVariant(w, list)
        if (c3 && tried.has(c3.word.toLowerCase())) c3 = null
        attempts++
    }
    if (!c1) {
        let rand = list.filter(v => v.word.toLowerCase() !== w.word.toLowerCase())
        if (rand.length) {
            const r = rand[Math.floor(Math.random() * rand.length)]
            c1 = { word: r.word, wordObj: getWordByText(r.word, list), label: '' }
        }
    }
    if (!c2) {
        let rand = list.filter(
            v => v.word.toLowerCase() !== w.word.toLowerCase() && v.word.toLowerCase() !== c1?.word.toLowerCase()
        )
        if (rand.length) {
            const r = rand[Math.floor(Math.random() * rand.length)]
            c2 = { word: r.word, wordObj: getWordByText(r.word, list), label: '' }
        }
    }
    if (!c3) {
        let rand = list.filter(
            v =>
                v.word.toLowerCase() !== w.word.toLowerCase() &&
                v.word.toLowerCase() !== c1?.word.toLowerCase() &&
                v.word.toLowerCase() !== c2?.word.toLowerCase()
        )
        if (rand.length) {
            const r = rand[Math.floor(Math.random() * rand.length)]
            c3 = { word: r.word, wordObj: getWordByText(r.word, list), label: '' }
        }
    }
    if (c1) candidates.push(c1)
    if (c2) candidates.push(c2)
    if (c3) candidates.push(c3)
    candidates = shuffle(candidates)
    candidates.map(v => {
        v.label = formatCandidateText(v)
    })
    const correctIndex = candidates.findIndex(v => v.word === w.word)
    return {
        stem: w,
        candidates,
        correctIndex,
        selectedIndex: -1,
        submitted: false,
    }
}
