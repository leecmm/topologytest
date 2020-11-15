// getWords: Get the word array from text. A single Chinese character is a word.
export function getWords(txt) {
    var words = [];
    var word = '';
    if (!txt) {
        txt = '';
    }
    for (var i = 0; i < txt.length; ++i) {
        var ch = txt.charCodeAt(i);
        if (ch < 33 || ch > 126) {
            if (word) {
                words.push(word);
                word = '';
            }
            words.push(txt[i]);
            continue;
        }
        else {
            word += txt[i];
        }
    }
    if (word) {
        words.push(word);
    }
    return words;
}
// getLines：Get lines of drawing text.
// words - the word array of text, to avoid spliting a word.
// maxWidth - the max width of the rect.
export function getLines(ctx, words, maxWidth, fontSize) {
    var lines = [];
    var currentLine = words[0] || '';
    for (var i = 1; i < words.length; ++i) {
        var word = words[i] || '';
        var text_1 = currentLine + word;
        var chinese = text_1.match(/[\u4e00-\u9fa5]/g) || '';
        var chineseLen = chinese.length;
        if ((text_1.length - chineseLen) * fontSize * 0.5 + chineseLen * fontSize <
            maxWidth) {
            currentLine += word;
        }
        else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}
function textBk(ctx, str, x, y, height, color) {
    if (!str || !color) {
        return;
    }
    var w = ctx.measureText(str).width;
    ctx.save();
    ctx.fillStyle = color;
    var l = x - w / 2;
    var t = y - height / 2;
    switch (ctx.textAlign) {
        case 'left':
            l = x;
            break;
        case 'right':
            l = x - w;
            break;
    }
    switch (ctx.textBaseline) {
        case 'top':
            t = y;
            break;
        case 'bottom':
            t = y - height;
            break;
    }
    ctx.fillRect(l, t, w, height);
    ctx.restore();
}
export function fillText(ctx, lines, x, y, width, height, lineHeight, maxLineLen, bk) {
    if (!maxLineLen || maxLineLen > lines.length) {
        maxLineLen = lines.length;
    }
    else {
        maxLineLen = Math.ceil(maxLineLen);
    }
    for (var i = 0; i < maxLineLen - 1; ++i) {
        if (bk) {
            textBk(ctx, lines[i], x, y + i * lineHeight, lineHeight, bk);
        }
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    if (maxLineLen < lines.length) {
        var str = (lines[maxLineLen - 1] || '') + '...';
        if (lines[maxLineLen - 1] && ctx.measureText(str).width > width) {
            str =
                lines[maxLineLen - 1].substr(0, lines[maxLineLen - 1].length - 2) +
                    '...';
        }
        if (bk) {
            textBk(ctx, str, x, y + (maxLineLen - 1) * lineHeight, lineHeight, bk);
        }
        ctx.fillText(str, x, y + (maxLineLen - 1) * lineHeight);
    }
    else {
        if (bk) {
            textBk(ctx, lines[maxLineLen - 1], x, y + (maxLineLen - 1) * lineHeight, lineHeight, bk);
        }
        ctx.fillText(lines[maxLineLen - 1], x, y + (maxLineLen - 1) * lineHeight);
    }
}
export function text(ctx, node) {
    if (!node.text) {
        return;
    }
    if (!node.text.split) {
        node.text += '';
    }
    ctx.save();
    ctx.beginPath();
    delete ctx.shadowColor;
    delete ctx.shadowBlur;
    ctx.font = (node.font.fontStyle || 'normal') + " normal " + (node.font.fontWeight || 'normal') + " " + node.font.fontSize + "px/" + node.font.lineHeight + " " + node.font.fontFamily;
    if (node.font.color) {
        ctx.fillStyle = node.font.color;
    }
    else {
        ctx.fillStyle = '#222';
    }
    if (node.font.textAlign) {
        ctx.textAlign = node.font.textAlign;
    }
    if (node.font.textBaseline) {
        ctx.textBaseline = node.font.textBaseline;
    }
    var textRect = node.getTextRect();
    var lines = [];
    var paragraphs = node.text.split(/[\n,]/g);
    for (var i = 0; i < paragraphs.length; ++i) {
        var l = getLines(ctx, getWords(paragraphs[i]), textRect.width, node.font.fontSize);
        lines.push.apply(lines, l);
    }
    var lineHeight = node.font.fontSize * node.font.lineHeight;
    var maxLineLen = node.textMaxLine || lines.length;
    // const rectLines = textRect.height / lineHeight;
    // if (!maxLineLen) {
    //   maxLineLen = lines.length > rectLines ? rectLines : lines.length;
    // }
    // By default, the text is center aligned.
    var x = textRect.x + textRect.width / 2;
    var y = textRect.y +
        (textRect.height - lineHeight * maxLineLen) / 2 +
        (lineHeight * 4) / 7;
    switch (ctx.textAlign) {
        case 'left':
            x = textRect.x;
            break;
        case 'right':
            x = textRect.x + textRect.width;
            break;
    }
    switch (ctx.textBaseline) {
        case 'top':
            y = textRect.y + (lineHeight - node.font.fontSize) / 2;
            break;
        case 'bottom':
            y = textRect.ey - lineHeight * lines.length + lineHeight;
            break;
    }
    fillText(ctx, lines, x + node.textOffsetX, y + node.textOffsetY, textRect.width, textRect.height, lineHeight, maxLineLen, node.font.background);
    ctx.restore();
}
export function iconfont(ctx, node) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var iconRect = node.getIconRect();
    var x = iconRect.x + iconRect.width / 2;
    var y = iconRect.y + iconRect.height / 2;
    switch (node.imageAlign) {
        case 'top':
            y = iconRect.y;
            ctx.textBaseline = 'top';
            break;
        case 'bottom':
            y = iconRect.ey;
            ctx.textBaseline = 'bottom';
            break;
        case 'left':
            x = iconRect.x;
            ctx.textAlign = 'left';
            break;
        case 'right':
            x = iconRect.ex;
            ctx.textAlign = 'right';
            break;
        case 'left-top':
            x = iconRect.x;
            y = iconRect.y;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            break;
        case 'right-top':
            x = iconRect.ex;
            y = iconRect.y;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            break;
        case 'left-bottom':
            x = iconRect.x;
            y = iconRect.ey;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            break;
        case 'right-bottom':
            x = iconRect.ex;
            y = iconRect.ey;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            break;
    }
    if (node.iconSize > 0) {
        ctx.font = node.iconSize + "px " + node.iconFamily;
    }
    else if (iconRect.width > iconRect.height) {
        ctx.font = iconRect.height + "px " + node.iconFamily;
    }
    else {
        ctx.font = iconRect.width + "px " + node.iconFamily;
    }
    if (!node.iconColor) {
        node.iconColor = '#2f54eb';
    }
    ctx.fillStyle = node.iconColor;
    ctx.beginPath();
    ctx.fillText(node.icon, x, y);
    ctx.restore();
}
