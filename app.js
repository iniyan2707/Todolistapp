const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser:true});

const itemsSchema = {
  name : String,
};


const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name:"Welcome to your todolist!"
});

const item2 = new Item({
  name:"Hit the + button to add new items."
});

const item3 = new Item({
  name:"<-- Hit this to delete an item."
});

const defaultItems =[item1, item2, item3];

const listSchema = {
  name :String, //listTitle
  items :[itemsSchema], // array of items which follow itemSchema
};

const List = mongoose.model("List",listSchema);



app.get("/", function(req, res) {


  Item.find({}, function(err,foundItems){

    if(foundItems.length===0)
    {
       Item.insertMany(defaultItems,function(err){
        if(err)
        {
          console.log(err);
        }
        else{
          console.log("Inserted all docs");
        }
      });
      res.redirect("/");
    }
    else
    {
      res.render("list", {
        listTitle: "Today",
        newListItems:foundItems,
      });
    }
  });
});

app.get("/:customListName", function(req,res){
  const customListName= _.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err, foundItem){
    if(!err)
    {
      if(!foundItem) // no item with the list name
      {
        const list = new List({
          name:customListName,
          items:defaultItems,
        });

        list.save();
        res.redirect("/"+customListName);
      }
      else
      {
        res.render("list", {
          listTitle: foundItem.name,
          newListItems:foundItem.items,
        });
      }
    }
  });




});

app.post("/",function(req,res){
  let itemName = req.body.newItem;
  let listName = req.body.list;

   const item = new Item({
   name : itemName,
  });

 if(listName === "Today")
 {
   item.save();
   res.redirect("/");
 }
 else{
   List.findOne({name:listName}, function(err,foundList){
     if(!err){
       foundList.items.push(item);
       foundList.save();
       res.redirect("/"+listName);
     }
   });
 }



});

app.post("/delete",function(req,res){
    const  checkedItemId=req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today")
    {
      Item.findByIdAndRemove(checkedItemId,function(err){
        if(!err)
        {
          console.log("Successfully deleted the item");
          res.redirect("/");
        }
      });
    }
    else{
      List.findOneAndUpdate({name:listName},{$pull :{items:{_id:checkedItemId}}}, function(err,foundList){

        if(!err)
        {
          res.redirect("/"+listName);
        }
      });
    }
});



app.get("/about", function(req,res){

  res.render("about");
});



app.listen(3000, function(req, res) {
  console.log("Server is running at port 3000")
});
