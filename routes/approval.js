import express from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import approvalModel from "../models/approvals.js";
import { approveApproval, declineApproval } from "../controllers/approvals.js";

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.usern,
        pass: process.env.passw
    }
});


router.get("/:approvalId/approve", async function (req, res, next) {

    const approve = await approveApproval(req, res);

    if (Object.prototype.toString.call(approve) === "[object Error]") 
    {
        res.status(approve.status)
        req.flash("message", approve.message );
        req.flash("status", approve.status);
        res.redirect("/home");
        return ;
    }
    else 
    {
        res.status(200)
        req.flash("message", "The Approval approved Successfully." );
        req.flash("status", 200);

        var mailOptions =  
        {
            from: process.env.usern,
            to: approve.studentid.email,
            subject: `WELCOME to ${approve.clubid.name} Club`,
            text: `Congratulations ${approve.studentid.name}, your approval for joining the ${approve.clubid.name} Club is approved.`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            error.message = "Unable to send mail right now.";
            error.status = 500;
            res.status(error.status)
            req.flash("message", error.message );
            req.flash("status", error.status);
        });
    }
    
    res.redirect(`/club/${approve.clubid._id}`);

});

router.get("/:approvalId/decline", async function (req, res, next) {

    const decline = await declineApproval(req, res);

    if (Object.prototype.toString.call(decline) === "[object Error]") {

        res.status(decline.status)
        req.flash("message", decline.message );
        req.flash("status", decline.status);
        res.redirect("/home");
        return ;
    }
    else 
    {
        res.status(200)
        req.flash("message", "The Approval declined Successfully." );
        req.flash("status", 200);

        var mailOptions = {
            from: process.env.usern,
            to: decline.studentid.email,
            subject: `Approval Declined`,
            text: `Sorry ${decline.studentid.name}, you approval for joining the ${decline.clubid.name} Club was declined.`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            error.message = "Unable to send mail right now.";
            error.status = 500;
            res.status(error.status)
            req.flash("message", error.message );
            req.flash("status", error.status);
        });
    }

    res.redirect(`/club/${decline.clubid._id}`);

});

router.get("/:approvalId/meet", async function (req, res, next) {

    if(req.session.passport === undefined)
    {
        var err = new Error("You are not logged in.");
        err.status = 400;
        res.status(err.status)
        req.flash("message", err.message );
        req.flash("status", err.status);
        res.redirect("/home");
        return ;
    }

    const { approvalId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(approvalId))
    {
        var err = new Error("The Approval doesn't exsist.");
        err.status = 406;
        res.status(err.status)
        req.flash("message", err.message );
        req.flash("status", err.status);
        res.redirect("/home");
        return ;
    }
    var approval;

    try {
        approval = await approvalModel.findById(approvalId)
                                      .populate("clubid", "presidentid")
                                      .populate("studentid", "name");
        
    } catch (error) {
        error.message = "Unable to access database.";
        res.status(error.status)
        req.flash("message", error.message );
        req.flash("status", error.status);
        res.redirect("/home");
        return ;      
    }

    if(approval == null)
    {
        var err = new Error("The Approval doesn't exsist.");
        err.status = 400;
        res.status(err.status)
        req.flash("message", err.message );
        req.flash("status", err.status);
        res.redirect("/home");
        return ;
    }
    
    if(req.session.passport.user != approval.clubid.presidentid )
    {
        var err = new Error("You are not president of club.");
        err.status = 400;
        res.status(err.status)
        req.flash("message", err.message );
        req.flash("status", err.status);
        res.redirect(`/club/${approval.clubid._id}`);
        return;
    }

    res.render('scheduleInterview',{ approval });
});

router.post("/:approvalId/meet", async function(req, res, next){

    if(req.session.passport === undefined)
    {
        var err = new Error("You are not logged in.");
        err.status = 400;
        res.status(err.status)
        req.flash("message", err.message );
        req.flash("status", err.status);
        res.redirect("/home");
        return ;
    }

    const { approvalId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(approvalId))
    {
        var err = new Error("The Approval doesn't exsist.");
        err.status = 406;
        res.status(err.status)
        req.flash("message", err.message );
        req.flash("status", err.status);
        res.redirect("/home");
        return ;
    }

    const body = req.body;

    function makeid() 
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      
        for (var i = 0; i < 10; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
      
        return text;
    }

    const meet = `meet.google.com/lookup/${makeid()}`;

    var approval;

    try {
        approval = await approvalModel.findById(approvalId)
                                .populate("studentid", ["name", "email"])
                                .populate("clubid", ["name", "presidentid"]);
        
    } catch (error) {
        error.message = "Unable to access database.";
        res.status(error.status)
        req.flash("message", error.message );
        req.flash("status", error.status);
        res.redirect("/home");
        return ;     
    }

    if(approval == null)
    {
        var err = new Error("The Approval doesn't exsist.");
        err.status = 400;
        res.status(err.status)
        req.flash("message", err.message );
        req.flash("status", err.status);
        res.redirect("/home");
        return ;
    }
    
    if(req.session.passport.user != approval.clubid.presidentid )
    {
        var err = new Error("You are not president of club.");
        err.status = 400;
        res.status(err.status)
        req.flash("message", err.message );
        req.flash("status", err.status);
        res.redirect(`/club/${approval.clubid._id}`);
        return;
    }

    
    var mailOptions = {
        from: process.env.usern,
        to: approval.studentid.email,
        bcc: req.user.email,
        subject: "Invitation to interview",
        text: `Dear ${approval.studentid.name},\nThe president of ${approval.clubid.name} Club wants to interview you on ${body.date} at ${body.time}.\nThe meet link is ${meet}.`
    };
    
    transporter.sendMail(mailOptions, function (error, info) {
        error.message = "Unable to send mail right now.";
        error.status = 500;
        res.status(error.status)
        req.flash("message", error.message );
        req.flash("status", error.status);
        res.redirect(`/club/${approval.clubid._id}`);
        return;
    });
    
    res.status(200)
    req.flash("message", "The Meeting is Scheduled Successfully." );
    req.flash("status", 200);

    res.redirect(`/club/${approval.clubid._id}`);
    
});

export default router;