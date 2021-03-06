

//###########################   INITIALIZE   ###########################

//Initialize: global variables
let page = 1;

//Initialize: HTML element references
const formRef = document.querySelector('.search__form');
const resultsRef = document.querySelector('.results');
const favouritesRef = document.querySelector('.favs');
const textboxRef = document.querySelector('.search__input');
const navRef = document.querySelector('.nav');
const detailsRef = document.querySelector('.details');
const resultsTitleRef = document.querySelector('.results__title');
const resultsWrapperRef = document.querySelector('.results__wrapper');
const favsMenuRef = document.querySelector('.favs');
const searchPreviewRef = document.querySelector('.search__preview');

//Initialize: local storage
const myStorage = window.localStorage;

//Initialize: populate favourites
refreshFavourites();

//###########################   EVENT LISTENERS   ###########################

//CLICK
document.addEventListener('click', event => {
    if (event.target.matches('.result, .preview')) { fetchDetails(event.target.getAttribute('data-id')); }
    if (event.target.matches('.nav__prev')) { prevButtonPressed(event); }
    if (event.target.matches('.nav__next')) { nextButtonPressed(event); }
    if (event.target.matches('.fa-sort-up')) { moveFavouriteUp(event.target.parentNode.getAttribute('data-id')); }
    if (event.target.matches('.fa-sort-down')) { moveFavouriteDown(event.target.parentNode.getAttribute('data-id')); }
    if (event.target.matches('.fav__title')) { fetchDetails(event.target.parentNode.getAttribute('data-id')); }
    if (event.target.matches('.details, .detail')) { toggleDetails(); }
    if (event.target.matches('.fa-heart')) { favsMenuRef.classList.toggle('favs--display'); }
    if (event.target.matches('.fa-sign-out-alt')) { logout(); }
});

//CHECKBOXES
document.addEventListener('change', event => favouriteChecked(event));

//SEARCH INPUT
textboxRef.addEventListener('input', event => initiatePreview(event));

//FORM SUBMIT
formRef.addEventListener('submit', submitSearch);

//INFINITE SCROLL
resultsRef.addEventListener('scroll', event => {
    if (resultsRef.scrollLeft + 100 > resultsRef.scrollWidth - resultsRef.clientWidth) {
        getMoreResults();
    }
});

//###########################   FUNCTIONS   ########################### 

//API Call
function fetchData(APIQuery, func, isInfiniteScroll) {
    fetch(APIQuery)
        .then(response => {
            if (!response.ok) { throw response; }
            return response.json();})
        .then(body => func(body, isInfiniteScroll))
        .catch(error => console.log(error));
}

//Initiate search preview
function initiatePreview(event) {
    if (event.target.value.length >= 3) {
        searchPreviewRef.classList.remove('search__preview--hidden');
        const searchQuery = formRef.search.value;
        const APIQuery = `http://www.omdbapi.com/?apikey=eee5954b&s=${searchQuery}&type=movie`;
        fetchData(APIQuery, renderPreview, false);
    }
    else { searchPreviewRef.classList.add('search__preview--hidden'); }
}

//Render search preview
function renderPreview(body) {
    searchPreviewRef.innerHTML = '';
    body.Search.forEach(item => {
        const preview = document.createElement('div');
        preview.setAttribute('class','preview');
        preview.setAttribute('data-id',item.imdbID);
        preview.innerHTML = item.Title;
        searchPreviewRef.appendChild(preview);
    });
}

//Search submit
function submitSearch(event) {
    event.preventDefault();
    searchPreviewRef.classList.add('search__preview--hidden');
    const searchQuery = formRef.search.value;
    const APIQuery = `http://www.omdbapi.com/?apikey=eee5954b&s=${searchQuery}&type=movie`;
    fetchData(APIQuery, renderResults, false);
    detailsRef.classList.add('details--hidden');
    resultsWrapperRef.classList.remove('results__wrapper--hidden');
    resultsTitleRef.innerHTML = `Search results for ${searchQuery}:`;
}

//Render search results
function renderResults(body, isInfiniteScroll) {
    if (!isInfiniteScroll) { resultsRef.innerHTML = ''; }
    body.Search.forEach(item => {
        const result = document.createElement('article');
        result.setAttribute('class','result');
        result.setAttribute('data-id',item.imdbID);
        result.setAttribute('data-title',item.Title);
        result.innerHTML = `<div class='result__wrapper'>
                            <img data-id=${item.imdbID} class='result result__poster' src=${item.Poster} alt=''>
                            <h6 data-id=${item.imdbID} class='result result__title'>${item.Title} (${item.Year})</h6>
                            <div class='detail'></div></div>`;
        resultsRef.appendChild(result);
    });
}

//Fetch more results for infinite scrolling
function getMoreResults() {
    page++;
    const searchQuery = formRef.search.value;
    const APIQuery = `http://www.omdbapi.com/?apikey=eee5954b&s=${searchQuery}&page=${page}&type=movie`;
    fetchData(APIQuery, renderResults, true);
 } 

//Fetch detailed movie information
function fetchDetails(imdbID) {
    searchPreviewRef.classList.add('search__preview--hidden');
    favsMenuRef.classList.remove('favs--display');
    const APIQuery = `http://www.omdbapi.com/?apikey=eee5954b&i=${imdbID}`;
    fetchData(APIQuery,renderDetails);
}

//Render detailed movie information
function renderDetails(body) {
    resultsWrapperRef.classList.add('results__wrapper--hidden');
    detailsRef.classList.remove('details--hidden');
    detailsRef.setAttribute('data-title', body.Title);
    detailsRef.innerHTML = 
                       `<div data-id=${body.imdbID} class='detail detail__header'><h1 data-id=${body.imdbID} class='detail detail__title'>${body.Title} (${body.Year})</h1><div data-id=${body.imdbID} class='detail detail__logos'><input id='check' class='detail__checkbox' type='checkbox' data-id=${body.imdbID}><label class='fa' for='check'></label><a href='https://www.imdb.com/title/${body.imdbID}/'><i class="fab fa-imdb"></i></a></div></div>
                        <h2 class='detail__plot'>${body.Plot}</h2> 
                        <img data-id=${body.imdbID} class='detail detail__poster' src=${body.Poster}>
                        <p data-id=${body.imdbID} class='detail detail__info'>${body.Genre}  |  Runtime: ${body.Runtime}  |  Rated ${body.Rated}  |  IMDB Score: ${body.imdbRating}</p>
                        <p class='detail detail__director'>Directed by: ${body.Director}</p>
                        <p class='detail detail__actors'>Actors: ${body.Actors}</p>
                        <p class='detail detail__awards'>Awards: ${body.Awards}</p>`
    refreshFavourites();
}

//Toggle search results & details divs
function toggleDetails() {
    detailsRef.classList.toggle('details--hidden');
    resultsWrapperRef.classList.toggle('results__wrapper--hidden');
}

//Favourite checkbox checked
function favouriteChecked(event) {
    if (event.target.matches('.detail__checkbox')) {
        const imdbID = event.target.getAttribute('data-id');
        const title = event.target.parentNode.parentNode.parentNode.getAttribute('data-title');
        if (event.target.checked) { addToFavourites(imdbID, title); }
        else { removeFromFavourites(imdbID); }
    }
}

//Add to favourites
function addToFavourites(imdbID, title) {
    let currentFavs = JSON.parse(myStorage.favourites);
    if (currentFavs === null) { currentFavs = [{'imdbID':imdbID,'Title':title}]; }
    else { currentFavs.push({'imdbID':imdbID,'Title':title}); }
    myStorage.favourites = JSON.stringify(currentFavs);
    refreshFavourites();
}

//Remove from favourites
function removeFromFavourites(imdbID) {
    let currentFavs = JSON.parse(myStorage.favourites);
    currentFavs = currentFavs.filter(item => (item.imdbID !== imdbID));
    myStorage.favourites = JSON.stringify(currentFavs);
    const favToUncheck = document.querySelector(`[data-id=${imdbID}] .detail__checkbox`);
    if (favToUncheck !== null) { favToUncheck.checked = false; }
    refreshFavourites();
}

//Generate HTML element for favourite
function generateFavourite(imdbID,title) {
    const favourite = document.createElement('div');
    favourite.setAttribute('class','fav');
    favourite.setAttribute('data-id',imdbID);
    favourite.innerHTML =  `<i class="fas fa-sort-up"></i>
                            <i class="fas fa-sort-down"></i>
                            <a class='fav__title'>${title}</a>`;
    return favourite;
}

 //Move favourite up in the list
 function moveFavouriteUp(imdbID) {
    let currentFavs = JSON.parse(myStorage.favourites);
    const favToMoveUp = currentFavs.filter(item => item.imdbID === imdbID)[0];
    const rank = currentFavs.indexOf(favToMoveUp);
    if (rank > 0) {
        currentFavs[rank] = currentFavs[rank-1];
        currentFavs[rank-1] = favToMoveUp;
        myStorage.favourites = JSON.stringify(currentFavs);
        refreshFavourites();
    }
}

//Move favourite down in the list
function moveFavouriteDown(imdbID) {
    let currentFavs = JSON.parse(myStorage.favourites);
    const favToMoveDown = currentFavs.filter(item => item.imdbID === imdbID)[0];
    const rank = currentFavs.indexOf(favToMoveDown);
    if (rank < currentFavs.length - 1) {
        currentFavs[rank] = currentFavs[rank+1];
        currentFavs[rank+1] = favToMoveDown;
        myStorage.favourites = JSON.stringify(currentFavs);
        refreshFavourites();
    }
}

//Reload favourites HTML elements from local storage
function refreshFavourites() {
    if (JSON.parse(myStorage.favourites) !== null) {
        favouritesRef.innerHTML = '';
        JSON.parse(myStorage.favourites).forEach(fav => {
            favouritesRef.appendChild(generateFavourite(fav.imdbID, fav.Title));
            const checkbox = document.querySelector(`[data-id=${fav.imdbID}] .detail__checkbox`);
            if (checkbox !== null ) { checkbox.checked = true; }
        });
    }
}

//Next page
function nextButtonPressed(event) {
    event.preventDefault();
    page++;
    const searchQuery = formRef.search.value;
    const APIQuery = `http://www.omdbapi.com/?apikey=eee5954b&s=${searchQuery}&page=${page}&type=movie`;
    fetchData(APIQuery, renderResults, false);
}

//Previous page
function prevButtonPressed(event) {
    event.preventDefault();
    if (page > 1) {
        page--;
        const searchQuery = formRef.search.value;
        const APIQuery = `http://www.omdbapi.com/?apikey=eee5954b&s=${searchQuery}&page=${page}&type=movie`;
    fetchData(APIQuery, renderResults, false);
    } 
}

//Clean up on logout
function logout() {
    myStorage.clear();
    myStorage.favourites = '[]';
    refreshFavourites();
    formRef.reset();
    detailsRef.classList.add('details--hidden');
    resultsWrapperRef.classList.add('results__wrapper--hidden');
}