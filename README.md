# Japanese-Memrise-Enhancements
A Google Chrome™ extension that enhances your Japanese learning experience on memrise.com.
Memrise is great for learning Japanese vocabulary, but it has a few shortcomings in that , which this browser extension seeks to mitigate. 

## Features

### Timer
The timer on Memrise just adds artificial difficulty. You remember things by recalling them and the harder it is to recall a word, the more effective the learning is (given of course that you do eventually manage to recall the word). The obnoxious timer is absolutely counterproductive in this regard.

In the default settings the extension automatically pauses the timer whenever a new word appears and also keeps Memrise from unpausing the timer if for example you pause the session and return. You can also click on the timer to (un-)pause it.

### Typing kana
Usually you would need an external IME to input kana if you don't have a japanese keyboard (or respective key-mappings), but those are rather tedious and sometimes contain auto correction and text prediction, which is not what you want when learning Japanese words. Also you have to switch the input back to roman letters when you need to input English again.

This extension uses the open source [WanaKana](http://wanakana.com/) javascript IME to automatically converts your romaji input to kana as you type whenever you are prompted for kana input.

![WanaKanaDemo](/readme-assets/4.gif)

The extension also makes sure to invoke WanaKana one last time right before the answer is checked by Memrise, to deal with those dreaded _trailing ん_.

![んDemo](/readme-assets/5.gif)

Typing can also be very tedious.

So if you think you know the answer, you can also just yell it at your monitor and then press the Tab key on your keyboard to autocomplete (yelling is optional).
Also, if available, the extension will try to show the kanji version of the word after you give a correct answer.

![TabDemo](/readme-assets/7.gif)

### Kana multiple-choice
Multiple-choice questions for kana are a joke, let's be honest.

By default, this extension replaces all kana multiple-choice questions with typing prompts instead.

### Kanji multiple choice
Kanji multiple choice isn't much better in that regard.

Using data from Lars Yencken's kanji similarity [dataset](http://lars.yencken.org/datasets/phd/), 
we can create much moch challenging options to choose from, so that you really have to learn to recognize the correct kanji and not just the overall appearance.

<figure>
    <img src='/readme-assets/6.png' alt='missing' />
    <figcaption>Thats not "difficult" at all!</figcaption>
</figure>

<figure>
    <img src='/readme-assets/2.png' alt='missing' />
    <figcaption>Now <i>that's</i> more like it!</figcaption>
</figure>

<figure>
    <img src='/readme-assets/3.png' alt='missing' />
    <figcaption>Problem?</figcaption>
</figure>

<figure>
    <img src='/readme-assets/1.png' alt='missing' />
    <figcaption>OK, I'm done. (and no, there are no duplicates)</figcaption>
</figure>

### Kanji typing
Traditionally, you'd have to type the word in kana (using your IME) and then select the right kanji from a drop down list. That's not very helpful when learning.

The extension replaces kanji typing prompts with multiple-choice questions instead.

## How to contribute
If you want to help with this project, here's what you can do:
* Think of a better name for this extension
* Design a logo for this extension
* Suggest features and report bugs
* Share the extension with people who may find it usefull as well
* And of course, since this is a public repository, you can directly contribute to the code

You can send these things to my [email address](mailto:gegglesdev@gmail.com).

## License

This project is licensed under the GNU GPL 3.0 License - see the [LICENSE](LICENSE) file for details
