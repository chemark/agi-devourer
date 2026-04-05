const WORKER_URL = 'https://agi-tongue-proxy.chengchuanhao728494.workers.dev';

const COMBO_FALLBACKS = [
    '三路模型在胃里开会，最后把缓存吵成了核聚变。',
    '算力胆汁倒灌，现场生成一朵会说黑话的蘑菇云。',
    '语料互相套壳，直接打出一口融资路演级别的怪嗝。',
    '参数彼此过拟合，嗝声里都带着 KPI 指标。',
];

const ENDGAME_WIN_FALLBACKS = [
    '全栈神经链路已热启动，变色龙靠一口怪嗝把自己吹成了 AGI。',
    '胃袋里完成了算力 IPO，这只蜥蜴从此不再是凡体。',
];

const ENDGAME_LOSE_FALLBACKS = [
    '最后一口气里全是未收敛的梯度，变色龙在幻觉里关机了。',
    '缓存烧尽，算力蒸发，只剩一声过拟合后的寂静回响。',
];

function pickRandom<T>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
}

export async function fetchEndgameStory(isWin: boolean, score: number, eatenModels: string[]): Promise<string> {
    const uniqueModels = [...new Set(eatenModels)];
    const sample = uniqueModels.slice(0, 6);
    const modelList = sample.length > 0 ? sample.join('、') : '一个模型也没吃到';

    const promptWin  = `一只变色龙在60秒内吸收了「${modelList}」，终于突破奇点进化为AGI！用60字内荒诞科技黑话写一段史诗胜利宣言，最后加一句毒舌赞语。纯JSON返回：{"story":"..."}`;
    const promptLose = `一只变色龙吸收了「${modelList}」，却只积累了${score}点，距AGI还有${Math.max(0, 4000 - score)}点就力竭而死。用60字内荒诞科技黑话写最后一嗝的气息，要幽默而凄凉。纯JSON返回：{"story":"..."}`;

    try {
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是毒舌AI科技解说员，只返回纯JSON。' },
                    { role: 'user',   content: isWin ? promptWin : promptLose }
                ],
                temperature: 1.3,
                stream: false
            })
        });
        const json = await res.json();
        const raw = json.choices?.[0]?.message?.content ?? '';
        const match = raw.match(/\{[\s\S]*?"story"\s*:\s*"([\s\S]*?)"[\s\S]*?\}/);
        const story = match ? match[1].replace(/\\n/g, ' ') : raw.slice(0, 80);
        return story;
    } catch {
        return isWin
            ? pickRandom(ENDGAME_WIN_FALLBACKS)
            : pickRandom(ENDGAME_LOSE_FALLBACKS);
    }
}

export async function fetchComboStory(ingredients: string): Promise<{description: string, score: number}> {
    const promptText = `一只变色龙吞了「${ingredients}」，请用 50 字内的荒诞科技黑话描述它打出了怎样的算力怪嗝，并给出 10 到 100 的变异得分。只返回 JSON：{"description":"...","score":99}`;

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是毒舌AI科技解说员，只返回纯JSON。' },
                    { role: 'user', content: promptText }
                ],
                temperature: 1.2, stream: false
            })
        });
        const data = await response.json();
        const rawText = data.choices[0].message.content;
        let result;
        try {
            result = JSON.parse(rawText.trim());
        } catch {
            result = {
                score: 50 + Math.floor(Math.random() * 50),
                description: pickRandom(COMBO_FALLBACKS),
            };
        }
        return result as {description: string, score: number};
    } catch {
        return {
            score: 50 + Math.floor(Math.random() * 50),
            description: pickRandom(COMBO_FALLBACKS),
        };
    }
}
