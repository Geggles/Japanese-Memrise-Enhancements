# Japanese-Memrise-Enhancements
A Google Chrome™ extension that enhances your Japanese learning experience on memrise.com.
Memrise is great for learning Japanese vocabulary, but it has a few shortcomings in that , which this browser extension seeks to mitigate. 

## Features

### Timer
The timer on Memrise just adds artificial difficulty. You remember things by recalling them and the harder it is to recall a word, the more effective the learning is (given of course that you do eventually manage to recall the word). The obnoxious timer is absolutely counterproductive in this regard.

In the default settings the extension automatically pauses the timer whenever a new word appears and also keeps Memrise from unpausing the timer if for example you pause the session and return. You can also click on the timer to (un-)pause it.

### Typing kana
Usually you would need an external IME to input kana if you don't have a japanese keyboard (or respective key-mappings), but those are rather tedious and sometimes contain auto correction and text prediction, which is not what you want when learning Japanese words. Also you have to switch the input back to roman letters when you need to input English again.

This extension uses the open source [WanaKana](http://wanakana.com/)[^1] javascript IME to automatically converts your romaji input to kana as you type whenever you are prompted for kana input.
[^1]: Copyright (c) 2013 WaniKani Community Github

![WanaKanaDemo](/readme-assets/4.gif)

The extension also makes sure to invoke WanaKana one last time right before the answer is checked by Memrise, to deal with those dreaded _trailing ん_.

![んDemo](/readme-assets/5.gif)

### Kana multiple-choice
Multiple-choice questions for kana are a joke, let's be honest.

By default, this extension replaces all kana multiple-choice questions with typing prompts instead.

### Kanji multiple choice
Kanji multiple choice isn't much better in that regard.
<figure>
    <img src='/readme-assets/6.png' alt='missing' />
    <figcaption>Thats not "difficult" at all!</figcaption>
</figure>
<figure>
    <img src='/readme-assets/2.png' alt='missing' />
    <figcaption>Now <i>that's</i> more like it!</figcaption>
</figure>
## License

This project is licensed under the GNU GPL 2.0 License - see the [LICENSE](LICENSE) file for details
