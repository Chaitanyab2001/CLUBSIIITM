import mongoose from "mongoose";
import clubModel from "../models/clubs.js";
import eventModel from "../models/events.js";

export const getEvent = async (req,res) => {

    if(req.session.passport === undefined)
    {
        var err = new Error("You are not logged in.");
        err.status = 400;
        return err;
    }

    const { eventId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(eventId))
    {
        var err = new Error("The Event doesn't exsist.");
        err.status = 406;
        return err;
    }

    //Event exsistance

    try {
        const event = await eventModel.findOne({ _id: eventId});
        return event;
        
    } catch (error) {
        error.message = "Unable to connect with database.";
        return error;
    }

};

export const getUpcomingEvents = async (req,res) => {

    try {
        const events = await eventModel.find({},[ "name", "date" ]);
        const comp = new Date().getTime();
        const comtime = 604800000;
        var recentevents = [];
        events.map((event) => { if(Math.abs(comp-(event.date).getTime()) <= comtime && (comp-(event.date).getTime()) <= 0) recentevents.push(event); });
        return recentevents;
        
    } catch (error) {
        error.message = "Unable to connect with database.";
        return error;
    }

};

export const postEvent = async (req,res) => {

    if(req.session.passport === undefined)
    {
        var err = new Error("You are not logged in.");
        err.status = 400;
        return err;
    }

    const { clubId } = req.params;
    
    if(!mongoose.Types.ObjectId.isValid(clubId))
    {
        var err = new Error("The Club doesn't exsist.");
        err.status = 406;
        return err; 
    }

    var club;

    try {
        club = await clubModel.findById(clubId);
        
    } catch (error) {
        error.message("Unable to connect to database.");
        return error;
    }

    const body = req.body;
    const newevent = new eventModel(body);

    if(club != null)
    {
        if(club.presidentid !== req.session.passport.user)
        {
            var err = new Error("You are not president of club.");
            err.status = 400;
            return err;
        }
        try {
            await newevent.save();
            try {
                await clubModel.findOneAndUpdate({ _id: clubId }, { $push: { eventids: newevent._id } });
                return newevent;
            
            } catch (error) {
                error.status = 400;
                error.message = "The club doesn't exsist.";
                return error;            
            }
        
        } catch (error) {
            error.message = "Meetlink or Event name already exsists";
            return error;     
        }
    }
    else
    {
        var err = new Error("The Club doesn't exsist.");
        err.status = 406;
        return err;
    }

};

export const putEvent = async (req,res) => {

    if(req.session.passport === undefined)
    {
        var err = new Error("You are not logged in.");
        err.status = 400;
        return err;
    }
    
    const { eventId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(eventId))
    {
        var err = new Error("The Event doesn't exsist.");
        err.status = 406;
        return err;
    }

    var event;
    
    try {
        event = await eventModel.findOne({ _id: eventId })
                                .populate("clubid", "presidentid");
        
    } catch (error) {
        error.message = "Unable to connect with database.";
        return error;   
        
    }
    
    if(event!=null)
    {
        if(event.clubid.presidentid !== req.session.passport.user)
        {
            var err = new Error("You are not president of club.");
            err.status = 400;
            return err;
        }
        try {
            await eventModel.updateOne({ _id: req.body._id }, req.body);
            return (await eventModel.findOne(req.body));
        
        } catch (error) {
            error.message = "Meetlink or Event name already exsists";
            return error;
        }
    }
    else
    {
        var err = new Error("The Event doesn't exsist.");
        err.code(406);
        return err;
    }
};

export const delEvent = async (req,res) => {

    if(req.session.passport === undefined)
    {
        var err = new Error("You are not logged in.");
        err.status = 400;
        return err;
    }

    const { eventId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(eventId))
    {
        var err = new Error("The Event doesn't exsist.");
        err.status = 406;
        return err;
    }

    var event;

    try {
        event = await eventModel.findOne({ _id: eventId})
                                .populate("clubid", "presidentid");
        
    } catch (error) {
        return error;  

    }
    
    if(event!=null)
    {
        if(event.clubid.presidentid !== req.session.passport.user)
        {
            var err = new Error("You are not president of club.");
            err.status = 400;
            return err;
        }
        try {
            await eventModel.deleteOne({ _id: eventId });
            return event;
        
        } catch (error) {
            return error;
        }
    }
    else
    {
        var err = new Error("The Event doesn't exsist.");
        err.code(406);
        return err;
    }
};