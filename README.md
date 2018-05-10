# Japanese-Memrise-Enhancements
A Google Chrome™ extension that enhances your Japanese learning experience on memrise.com.
Memrise is great for learning Japanese vocabulary, but it has a few shortcomings in that , which this browser extension seeks to mitigate. 

## Disclaimer
Since Memrise updated their code to use ES Modules bundled into a function whose content cannot be accessed from the outside, pretty much all of the code here does not work anymore. I have a fix in mind, involving static code transformation to do introspection on Memrise functions with the help of their source maps, but it might take a while until I have the time to implement it (because of univerity).

I wanted to wait with the release of this code until all the features were finished, but since Memrise' changes have completely wreckt my project, I though "might as well". All freatures were finished months ago, but the one that changes the titel, translation etc. of the vocabulary items turned out to be much more difficult than I anticipated. The feature itself used to work a long time ago, but the ability to change those labels in the options is very tedious, especially because I'm using [Fancy Settings](https://github.com/LiminalSoftware/fancy-settings) to do the options page, which was not a good idea. Ideally I would make my own settings page, but I just don't have the time to do all of that side work. 

The structure of the whole project (managed by the build.js file) is organized in a way that is intuitive, but might need some explanation if somebody wants to change something about the inner workings of that, since I haven't left many comments in there. Many other things, like the `SemiPromises` are informally documented (since I'm not currently using any documentation engine, because I don't know if anybody is even going to read those) and yet others like `existingProperty` are not documented at all. Again, I don't know if anybody even wants or needs explanations on those; there are probably libraries out there that do the same thing. I just like doing things like that myself because it's fun.

## Features

### Timer
The timer on Memrise just adds artificial difficulty. You remember things by recalling them and the harder it is to recall a word, the more effective the learning is (given of course that you do eventually manage to recall the word). The obnoxious timer is absolutely counterproductive in this regard.

In the default settings the extension automatically pauses the timer whenever a new word appears and also keeps Memrise from unpausing the timer if for example you pause the session and return. You can also click on the timer to (un-)pause it.

### Typing kana
Usually you would need an external IME to input kana if you don't have a japanese keyboard (or respective key-mappings), but those are rather tedious and sometimes contain auto correction and text prediction, which is not what you want when learning Japanese words. Also you have to switch the input back to roman letters when you need to input English again.

This extension uses the open source [WanaKana](http://wanakana.com/) javascript IME to automatically convert your romaji input to kana as you type whenever you are prompted for kana input.

![WanaKanaDemo](/readme-assets/4.gif)

The extension also makes sure to invoke WanaKana one last time right before the answer is checked by Memrise, to deal with those dreaded _trailing ん_.

![んDemo](/readme-assets/5.gif)

However, typing can be very tedious.

So if you think you know the answer, you can also just yell it at your monitor and then press the Tab key on your keyboard to autocomplete (yelling is optional).
Also, if available, the extension will try to show the kanji version of the word after you give a correct answer.

![TabDemo](/readme-assets/7.gif)

### Kana multiple-choice
Multiple-choice questions for kana are a joke, let's be honest.

By default, this extension replaces all kana multiple-choice questions with typing prompts instead.

### Kanji multiple choice
Kanji multiple choice isn't much better in that regard.

Using data from Lars Yencken's kanji similarity [dataset](http://lars.yencken.org/datasets/phd/), 
we can create much more challenging options to choose from, so that you really have to learn to recognize the correct kanji and not just the overall appearance.

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

### Custom prompt labels
Often, especially when dealing with courses from different creators, the prompt they give you can be ambiguous.

That's why the extension allows you to simply click onto the prompt label and change it to your heart's desires and it will show the custom prompt every time you see that item (this does not change the actual course, just the way it is presented to the user).

![LabelDemo](/readme-assets/8.gif)

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
