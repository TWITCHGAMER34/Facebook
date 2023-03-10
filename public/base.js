/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function dropdown() {
    document.getElementById("myDropdown").classList.toggle("show"); // show the dropdown
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) { // when the user clicks anywhere outside of the dropdown, close it
    if (!event.target.matches('.dropbtn')) { // if the user clicks on the button, don't close the dropdown
        let dropdowns = document.getElementsByClassName("dropdown-content"); // get all the dropdowns
        let i; // loop through all the dropdowns
        for (i = 0; i < dropdowns.length; i++) { // if the dropdown is open, close it
            let openDropdown = dropdowns[i]; // if the dropdown is open, close it
            if (openDropdown.classList.contains('show')) { // if the dropdown is open, close it
                openDropdown.classList.remove('show'); // if the dropdown is open, close it
            }
        }
    }
}