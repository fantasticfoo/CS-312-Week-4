//jshint esversion:6

// require two packages
// that you install in cmd
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// create app constant by using express
const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://foo4:1tR8lbxdrwhfhJ9k@cluster0.kanon4f.mongodb.net/todolistDB?retryWrites=true&w=majority&appName=Cluster0");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// get route that sends the user what's up
// when trying to access home route
app.get("/", async function(req, res) {

    try{
        const foundItems = await Item.find({});

        if(foundItems.length === 0) {
            await Item.insertMany(defaultItems);
            console.log("Successfully saved default items to DB.");
            res.redirect("/");
            } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
        
         } catch(err) {
            console.error("Error retrieving items:", err);
            res.status(500).send("Error retrieving items.");
         }

        });

app.get("/:customListName", async function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    try {
        const foundList = await List.findOne({name: customListName});
       
        if(!foundList) {
            // create a new list
            const list = new List({
                name: customListName,
                items: defaultItems
            });
        
            list.save();
            res.redirect("/" + customListName);
        }

        // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        
        } catch(err) {
            console.error(err);
        }




});

app.post("/", async function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    try {
        
        if(listName === "Today"){
            await item.save();

            res.redirect("/");
        } else {
            const foundList = await List.findOne({name: listName});
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            }
        } catch(err) {
            console.error(err);
        }
});

app.post("/delete", async function(req, res) {
    const checkedItemId = (req.body.checkbox);
    const listName = req.body.listName;
    try {

        if(listName === "Today") {
        
            const result = await Item.findByIdAndDelete(checkedItemId);

            if(result){
                console.log("Successfully deleted checked item.");

               } else {
                console.log("Item not found.")
               } 
               res.redirect("/");
            } else {
                const foundList = await List.findOneAndUpdate(
                    {name: listName}, 
                    {$pull: {items: {_id: checkedItemId}}},
                    {new: true}
                );
                if(foundList) {
                    res.redirect("/" + listName);
                } else{
                    console.log("List not found");
                }
            } }
             catch(err){
                console.error(err);
            }
        });
            



app.get("/about", function(req, res){
    res.render("about");
});

let port = process.env.PORT;
if(port == null || port == "") {
    port = 3000;
}

// listen on port 3000
// console log that the server is started
app.listen(port, function(){
    console.log("Server has started successfully.");
});