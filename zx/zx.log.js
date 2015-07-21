var ZenXStr = "\033[0m[Zen\033[33mX\033[0m] ";

module.exports = function (string) {

    console.log(ZenXStr + "\033[36m" + string + "\033[0m");

}