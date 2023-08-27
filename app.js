const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const _ = require("lodash");

const date = require(__dirname + "/date.js");

let day = date.getDate();

let today = date.getDay();


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb+srv://ruben:rub54321@cluster0.irc2gdd.mongodb.net/todolistDB', {useNewUrlParser: true});

const itemsSchema =  ({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your toDo list"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get('/', function (req, res) {
  
    Item.find({})
      .then(foundItems => {
        if (foundItems.length === 0) {
          return Item.insertMany(defaultItems);
        } else {
          return foundItems;
        }
      })
      .then(items => {
        if (items.length === 0) {
          console.log("No items found and no default items were added.");
        } else if (items === defaultItems) {
          console.log("Successfully saved default items to the DB");
        }
        res.render("list", { listTitle: day, newListItems: items });
      })
      .catch(err => {
        console.log(err);
      });
  });
  
  
  app.get("/:customListName", async function(req,res){

    const customListName = _.capitalize(req.params.customListName);

    try {
        const foundList = await List.findOne({name: customListName});

        if (!foundList) {
            const list = new List ({
                name: customListName,
                items: defaultItems
            });

            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
    } catch (err) {
        console.log(err);
    }



});





app.post('/', async function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;


    const item = new Item({
        name: itemName
    });

    if (listName === today + ",") {
        
        item.save();
        res.redirect("/");
    } else {
        try {
            const foundList = await List.findOne({name: listName});
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/" + listName);
        } catch (err) {
            console.log(err);
        }
    }
});


app.post("/delete", function(req,res){

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    
    Item.findOneAndRemove({_id: checkedItemId})
        .then(() => {
            if (listName === day) {   
                console.log("successfully deleted checked item.");
                res.redirect("/");
            } else {
                List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
                    .then(foundList => {
                        res.redirect("/" + listName);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        })
        .catch(err => {
            console.log(err);
        });
    
});


app.get("/work", function (req, res) {
    res.render("list", { listTitle: "Work list", newListItems: workItems });
});


app.listen(process.env.PORT || 3000, function () {
    console.log('server started on port 3000');
});