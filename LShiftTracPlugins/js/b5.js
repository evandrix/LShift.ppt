/* b5.js
 *
 * Script to simulate projection mode on browsers that don't support
 * media=projection but do support Javascript.
 *
 * Add it to a page with
 *
 *   <script src="b5.js" type="text/javascript"></script>
 *
 * The script assumes each slide starts with an H1 or an element with
 * class "slide", which is a direct child of the BODY. All elements
 * until the next H1 or class "slide" are part of the slide, except
 * for those with a class of "comment", which are hidden in slide
 * mode.
 *
 * Usage:
 *
 * - Press A (or Shift+A on some browsers) to toggle normal and slide
 *   mode. The script starts in normal mode.
 *
 * - Press Page-Down/Page-Up to to advance/back-up one page.
 *
 * - Press Space or mouse button 1 to advance (incremental display or
 *   next slide)
 *
 * To do: use ID of H1 and fragment IDs?
 *
 * To do: use whatever element has 'page-break-before: always; instead
 * of H1. (Is this possible? Do browsers store properties they don't
 * implement?)
 *
 * Derived from code by Dave Raggett.
 *
 * Author: Bert Bos <bert@w3.org>
 * Created: May 23, 2005
 *
 * Copyright 2005 W3C (MIT, ERCIM, Keio)
 * See http://www.w3.org/Consortium/Legal/copyright-software
 */


/* Global variables */
var curslide = null;
var slidemode = false;		// In slide show mode or normal mode?
var stylesheet = null;		// A style sheet with media=projection
var incremental = null;		// Next elt. in an incremental display


/* nextNode -- depth-first left-to-right tree traversal */
function nextNode(root, cur)
{
  var h;

  if (cur.firstChild != null) return cur.firstChild;
  else if (cur == root) return null;
  else if (cur.nextSibling != null) return cur.nextSibling;
  else {
    for (h = cur.parentNode; h != root && h.nextSibling; h = h.parentNode);
    if (h != root) return h.nextSibling; else return null;
  }
}


/* initIncrementalElement -- initialize an incremental display, if any */
function initIncrementalElement(e)
{
  var h, first = null;

  /* Find the first descendant with class incremental or overlay */
  h = e;
  while (h != null 
	 && (h.nodeType != 1 /*Node.ELEMENT_NODE*/
	     || (h.className != "incremental"
		 && h.className != "overlay")))
    h = nextNode(e, h);

  /* If we found one, make its children invisible */
  if (h != null) {
    for (h = h.firstChild; h != null; h = h.nextSibling)
      if (h.nodeType == 1 /*Node.ELEMENT_NODE*/) {
	h.style.visibility = "hidden";
	if (first == null) first = h;
    }
  }

  /* Return the first of the now invisible children, if any */
  return first;
}


/* hasClass -- see if an element has a certain class */
function hasClass(elt, classname)
{
  var re;

  if (elt.nodeType != 1 /*Node.ELEMENT_NODE*/) return false;
  re = new RegExp("\\b" + classname + "\\b");
  return elt.className.search(re) >= 0;
}


/* displaySlide -- make the slide starting with elt visible */
function displaySlide(elt)
{
  var h;

  incremental = null;

  /* assert(elt.nodeName == "H1" || hasClass(elt, "slide")) */
  elt.style.display = "";
  for (h = elt.nextSibling; h != null && h.nodeName != "H1"
	 && !hasClass(h, "slide"); h = h.nextSibling) {
    if (h.nodeType == 1 /*Node.ELEMENT_NODE*/ && !hasClass(h, "comment")) {
      h.style.display = "";
      if (incremental == null) incremental = initIncrementalElement(h);
    }
  }
}


/* hideSlide -- make the slide starting with elt invisible */
function hideSlide(elt)
{
  var h;

  /* assert(elt.nodeName == "H1" || hasClass(elt, "slide")) */
  elt.style.display = "none";
  for (h = elt.nextSibling; h != null && h.nodeName != "H1"
	 && !hasClass(h, "slide"); h = h.nextSibling) {
    if (h.nodeType == 1 /*Node.ELEMENT_NODE*/) h.style.display = "none";
  }
}


/* keyDown -- handle key presses on the body element */
function keyDown(event)
{
  var key;

  if (window.event) key = window.event.keyCode;
  else if (event.which) key = event.which;
  else return true;		// Unknown browser

  if (slidemode) {
    if (key == 34) nextSlide();			// Page Down
    else if (key == 33) previousSlide();	// Page Up
    else if (key == 32) nextSlideOrElt(); 	// Space bar
    else if (key == 36) firstSlide();		// Home
    else if (key == 35) lastSlide();		// End
    else if (key == 65) toggleMode();		// Key A
    else return true;
  } else {
    if (key == 65) toggleMode();		// Key A
    else return true;
  }

  return false;
}


///* windowwidth -- get width of window in px */
//function windowWidth()
//{
//  if(typeof( window.innerWidth) == 'number' ) {
//    return window.innerWidth;	// Non IE browser
//  } else if (document.documentElement && document.documentElement.clientWidth) {
//    return document.documentElement.clientWidth; // IE6
//  } else if (document.body && document.body.clientWidth) {
//    return document.clientWidth; // IE4
//  } else {
//    return 800;			// Just a guess...
//  }
//}


/* contains -- see if a list contains an item */
function contains(list, item)
{
  var i, re;

  if (typeof(list) == "string") { // MSIE

    re = new RegExp("\\b" + item + "\\b");
    return re.test(list);

  } else {			// MediaList (DOM2)

    for (i = 0; i < list.length; i++)
      if (list.item(i).valueOf() == item) return true;
    return false;
  }
}


/* replaceby -- replace a word in a list by another */
function replaceby(list, from, to)
{
  var re;

  // assert(contains(list, from));
  if (typeof(list) == "string") { // MSIE
    re = new RegExp("\\b" + from + "\\b", "gi");
    list.replace(re, to);
  } else {			// MediaList (DOM2)
    list.deleteMedium(from);
    list.appendMedium(to);
  }
}
  

/* toggleMedia -- swap styles for projection and screen */
function toggleMedia()
{
  var i, e;

  /* To do: Safari & Konqueror don't apply the changed styles correctly */

  try {			// Konqueror & Safari don't know the field "media"
    for (i = 0; i < document.styleSheets.length; i++)
      with (document.styleSheets[i])
	if (!disabled) {
	  disabled = true;	// Force re-run of the CSS cascade
	  if (contains(media, "projection") && !contains(media, "screen"))
	    replaceby(media, "projection", "screen");
	  else if (contains(media, "screen") && !contains(media, "projection"))
	    replaceby(media, "screen", "projection");
	  disabled = false;	// Force re-run of the CSS cascade
	}
  } catch(e) {		 // Try manipulating LINK elements instead :-(
    with (document.getElementsByTagName("LINK"))
      for (i = 0; i < length; i++)
	with (item(i))
	  if (rel == "stylesheet")
	    if (media != null)
	      if (media.indexOf("projection") >= 0
		  && media.indexOf("screen") < 0)
		media = media.replace(/projection/, "screen");
	      else if (media.indexOf("screen") >= 0
		       && media.indexOf("projection") < 0)
		media = media.replace(/screen/, "projection");
    with (document.getElementsByTagName("STYLE"))
      for (i = 0; i < length; i++)
	if (media != null)
	  if (media.indexOf("projection") >= 0
	      && media.indexOf("screen") < 0)
	    media = media.replace(/projection/, "screen");
	  else if (media.indexOf("screen") >= 0
		   && media.indexOf("projection") < 0)
	    media = media.replace(/screen/, "projection");
  }
}


/* toggleMode -- toggle between slide show and normal display */
function toggleMode()
{
  var h;

  if (! slidemode) {
    /* Make all children of body invisible */
    for (h = document.body.firstChild; h != null; h = h.nextSibling)
      if (h.nodeType == 1 /*Node.ELEMENT_NODE*/) h.style.display = "none";
    toggleMedia();		// Swap style sheets
    firstSlide();		// Show first slide
    //document.body.style.fontSize = "" + (windowWidth() * 0.04) + "px";
    slidemode = true;
  } else {
    /* Remove the 'display: none from all children again */
    for (h = document.body.firstChild; h != null; h = h.nextSibling)
      if (h.nodeType == 1 /*Node.ELEMENT_NODE*/) h.style.display = "";
    toggleMedia();
    //document.body.style.fontSize = "";
    slidemode = false;
  }
}


/* nextSlideOrElt -- next incremental element or next slide if none */
function nextSlideOrElt()
{
  if (incremental != null) {
    incremental.style.visibility = "visible";
    incremental = incremental.nextSibling;
    while (incremental != null
	   && incremental.nodeType != 1 /*Node.ELEMENT_NODE*/)
      incremental = incremental.nextSibling;
  } else {
    nextSlide();
  }
}
  

/* nextSlide -- display the next slide, if any */
function nextSlide()
{
  var h;

  if (curslide == null) return;

  /* assert(curslide.nodeName == "H1" || hasClass(curslide, "slide")) */
  h = curslide.nextSibling;
  while (h != null && h.nodeName != "H1" && !hasClass(h, "slide"))
    h = h.nextSibling;

  if (h != null) {
    hideSlide(curslide);
    curslide = h;
    displaySlide(curslide);
  }
}


/* previousSlide -- display the next slide, if any */
function previousSlide()
{
  var h;

  if (curslide == null) return;

  /* assert(curslide.nodeName == "H1" || hasClass(curslide, "slide")) */
  h = curslide.previousSibling;
  while (h != null && h.nodeName != "H1" && !hasClass(h, "slide"))
    h = h.previousSibling;

  if (h != null) {
    hideSlide(curslide);
    curslide = h;
    displaySlide(curslide);
  }
}


/* firstSlide -- display the first slide */
function firstSlide()
{
  curslide = document.body.firstChild;
  while (curslide != null && curslide.nodeName != "H1"
	 && !hasClass(curslide, "slide"))
    curslide = curslide.nextSibling;

  if (curslide != null) displaySlide(curslide);
}


/* lastSlide -- display the last slide */
function lastSlide()
{
  var h;

  for (h = document.body.firstChild; h != null; h = h.nextSibling) {
    if (h.nodeName == "H1" || hasClass(h, "slide")) curslide = h;
  }

  if (curslide != null) displaySlide(curslide);
}

/* mouseButtonClick -- handle mouse click event */
function mouseButtonClick(e)
{
  var rightclick = false;
  var target;

  if (!slidemode)
    return true;

  if (!e)
    var e = window.event;

  if (e.target)
    target = e.target;
  else if (e.srcElement)
    target = e.srcElement;

  // work around Safari bug
  if (target.nodeType == 3)
    target = target.parentNode;

  if (e.which)
    rightclick = (e.which == 3);
  else if (e.button)
    rightclick = (e.button == 2);

  // check if target is something that probably want's clicks
  // e.g. embed, object, input, textarea, select, option

  if (!rightclick
      && target.nodeName != "A"
      && target.nodeName != "EMBED"
      && target.nodeName != "OBJECT"
      && target.nodeName != "INPUT"
      && target.nodeName != "TEXTAREA"
      && target.nodeName != "SELECT"
      && target.nodeName != "OPTION") {
    nextSlideOrElt();
    if (e.stopPropagation)
      e.stopPropagation();	// DOM2
    else
      e.cancelBubble = true;	// MSIE
  }
  return true;
}


/* main */

/* To do: don't do anything if media = projection */

document.onclick = mouseButtonClick;
document.onkeydown = keyDown;
       
