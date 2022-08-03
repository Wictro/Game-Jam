const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let level;

if(params.level != null && !isNaN(params.level)){
    level = parseInt(params.level);
}
else{
    level = 1;
}

let logo = new Image();
logo.src = "assets/images/game-name.png";

logo.onload = () =>{
    document.getElementById("game-title").setAttribute("src", logo.src);
}

class Square{
    /**
     * element: The HTML element where this should render
     * images: an array of image links to be shuffled on the board
    */
    constructor(element, imageParts, parent){
        this.element = element;
        this.imageParts = imageParts;
        this.parent = parent;
        this.currentIndex = -1;
        this.setup = false;
        this.addEventListeners = this.addEventListeners.bind(this);
        this.addEventListeners();
        this.element.click();
    }

    addEventListeners(){
        this.element.addEventListener("click", () => {
            if(this.setup){
                this.parent.sounds['click'].currentTime = 0;
                this.parent.sounds['click'].play();
            }

            this.currentIndex++;

            if(this.currentIndex == this.imageParts.length)
                this.currentIndex = 0;
            
            this.element.style.backgroundImage = `url(${this.imageParts[this.currentIndex].image.src})`;
            
            if(!this.setup){
                this.setup = true;
            }
            else{
                this.parent.checkState();
            }
        });
    }
}

class ImagePart{
    constructor(image, character){
        this.image = image;
        this.character = character;
    }
}

class Game{
    //size is the number of rows/columns
    constructor(level){
        this.element = document.getElementById("game");
        this.level = level;
        this.grid = document.getElementById("gridlines");

        // switch(level){
        //     case 1:
        //         this.size = 2;
        //         this.numCharacters = 4;
        //         break;
        //     case 2:
        //         this.size = 3;
        //         this.numCharacters = 3;
        //         break;
        //     case 3:
        //         this.size = 4;
        //         this.numCharacters = 3;
        //         break;
        //     default:
        //         this.size = 2;
        //         this.numCharacters = 3;
        //         this.level = 1;
        //         break;
        // }

        this.numCharacters = 2;
        this.size = this.level + 1;

        this.element.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.element.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
        this.grid.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.grid.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;

        this.sounds = [];

        this.sounds['success'] = document.getElementById("success_audio");
        this.sounds['click'] = document.getElementById("click_audio");
        this.sounds['countdown'] = document.getElementById("countdown_audio");

        this.basePath = `assets/testcharacters/`;

        this.squares = [];
        this.images = [];

        for(let square = 1; square <= this.size * this.size; square++){
            let div = document.createElement('div');
            div.id = `${square}`;
            div.style.backgroundSize = `${this.size * 100}%`;

            let col = (square - 1) % this.size; //0, 1, 2
            let row = Math.floor((square - 1) / this.size); //0, 1, 2

            div.style.backgroundPosition = `${(col / (this.size - 1)) * 100}% ${(row / (this.size-1)) * 100}%`;
            this.element.appendChild(div);
            
            this.grid.appendChild(document.createElement('div'));

            let imageParts = [];

            for(let character = 1; character <= this.numCharacters; character++){
                let image;

                if(this.images[character - 1]){
                    image = this.images[character - 1];
                }
                else{
                    image = new Image();
                    image.src = this.basePath + `${character}.png`;
                    this.images[character - 1] = image;
                }
                
                imageParts[character - 1] = new ImagePart(image, character);
            }
            
            this.squares[square - 1] = new Square(div, this.shuffle(imageParts), this);
        }

        this.found = [];
        this.foundNumber = 0;
        this.status = document.getElementById("status");

        this.checkState = this.checkState.bind(this);
        this.shuffle = this.shuffle.bind(this);
        this.addGird = this.addGrid.bind(this);
        this.removeGrid = this.removeGrid.bind(this);
    }

    shuffle(array){
        let currentIndex = array.length,  randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    checkState(){
        //for each of the squares check if the character is the same
        let character;

        for(let i = 0; i < this.squares.length; i++){
            if(!character){
                character = this.squares[i].imageParts[this.squares[i].currentIndex].character;
            }
            else{
                if(character !== this.squares[i].imageParts[this.squares[i].currentIndex].character){
                    this.addGrid();
                    return;
                }
            }
        }

        if(!this.found[character]){
            this.foundNumber++;
            setTimeout(() => {
                // this.element.style.gap = 'unset';
                this.removeGrid();
                // this.element.style.border = '5px solid #14bf47';
                this.sounds['success'].play();
                document.getElementById(`character_${character}`).classList.add("show");
                this.status.innerHTML = `${this.foundNumber}/${this.numCharacters} thieves found`;
                this.found[character] = true;

                //if the level is over, do something
                if(this.foundNumber == this.numCharacters){
                    setTimeout(() => {
                        let success = document.getElementById("game-over-container");
                        success.classList.add("show");
                    
                        let qrContainer = document.getElementById("qr-container");
                        let qr = document.getElementById("qr");
                        let info = document.getElementById("team-info");
                        
                        let nextLevel = location.origin + location.pathname + `?level=${this.level+1}`;
                        new QRCode(qr, nextLevel);
                        qr.onclick = () => {
                            location.href = nextLevel;
                        }
                    
                        setTimeout(() => {
                            qrContainer.style.opacity = "1";
                            qr.style.opacity = "1";
                            info.style.opacity = "1";
                        }, 1000);
                    }, 1000);
                }

                setTimeout(() => {
                    this.addGrid();
                }, 1000);
            }, 500);
        }
    }

    removeGrid(){
        this.grid.classList.add("hide");
    }

    addGrid(){
        this.grid.classList.remove("hide");
    }
}

function startGame(){
    let element = event.target;
    let div = document.getElementById("start-game-container");
    let game = new Game(level);
    
    element.style.display = 'none';

    let counter = document.getElementById("counter");
    counter.style.display = 'block';
    let i = 2;
    game.sounds['countdown'].play();

    setInterval(() => {
        if(i == -1){
            div.style.display = 'none';
            clearInterval(this);
            return;
        }
        else if(i == 0){
            counter.innerHTML = "GO!";
            i--;
        }
        else{
            counter.innerHTML = i--;
        }
    }, 1000);
}