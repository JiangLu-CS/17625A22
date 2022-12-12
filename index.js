import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Doctor { 
    id:Int! 
    name:String
    clinicName:String
    specialty:String
    calendar: [Appointment]
  } 

  type Appointment {
    id:Int!
    patientName:String
    doctorID:Int
    time:TimeSlot
    canceled: Boolean
  }

  type TimeSlot{
    hour: Int!
    minute: Int!
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    doctors: [Doctor]
    appointments: [Appointment]
    timeslots: [TimeSlot]
    getDoctorDetails(id:Int!): Doctor
    getDoctorAvailability(id:Int!): [TimeSlot]
    bookAppointment(id:Int!, hour:Int!, minute: Int!, patientName:String!): Boolean
    cancelAppointment(id:Int!, appointmentID:Int!): Boolean
    updateAppointment(id:Int!, appointmentID:Int!, patientName:String!): Boolean
  }
`;

const timeslot = [
  {
    hour: 9,
    minute: 0
  },
  {
    hour: 9,
    minute: 30
  },
  {
    hour: 10,
    minute: 0
  },
  {
    hour: 10,
    minute: 30
  },
  {
    hour: 11,
    minute: 0
  },
  {
    hour: 11,
    minute: 30
  },
  {
    hour: 12,
    minute: 0
  },
  {
    hour: 12,
    minute: 30
  },
  {
    hour: 13,
    minute: 0
  },
  {
    hour: 13,
    minute: 30
  },
  {
    hour: 14,
    minute: 0
  },
  {
    hour: 14,
    minute: 30
  },
  {
    hour: 15,
    minute: 0
  },
  {
    hour: 15,
    minute: 30
  },

  {
    hour: 16,
    minute: 0
  },
  {
    hour: 16,
    minute: 30
  },
]

const appointment = [
  {
    id: 0,
    patientName: "patient1",
    doctorID: 0,
    time:
      {
        hour: 10,
        minute: 30 
      },
    canceled: false
    },
    {
      id: 1,
      patientName: "patient2",
      doctorID: 1,
      time:
        {
          hour: 11,
          minute: 0 
        },
      canceled: false
    },
]

const doctors = [
  {
    id:0,
    name:"doctor1",
    clinicName:"clinic1",
    specialty:"gynecologist", 
    calendar:   [
      appointment[0]
    ]
  },
  {
    id:1,
    name:"doctor2",
    clinicName:"clinic2",
    specialty:"gynecologist", 
    calendar:   [
      appointment[1],
    ]
  },
];

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    doctors: () => doctors,
    getDoctorDetails(parent, args, context, info) {
      return doctors.find((getDoctorDetails) => getDoctorDetails.id === args.id);
    },

    getDoctorAvailability(parent, args, context, info) {
      var d = doctors.find((getDoctorAvailability) => getDoctorAvailability.id === args.id);
      if(d == null) return null;
      var t = [];
      for(var i = 0; i < timeslot.length; i++){
        var has = false;
        for(var j = 0; j < d.calendar.length; j++){
          if(d.calendar[j].time.hour == timeslot[i].hour && 
            d.calendar[j].time.minute == timeslot[i].minute &&
            !d.calendar[j].canceled) has = true;
        }
        if(!has) t.push(timeslot[i]);
      }
      return t;
    },

    bookAppointment(parent, args, context, info) {
      var d = doctors.find((bookAppointment) => bookAppointment.id === args.id);
      // time does not fall in slot
      if(args.hour < 9 || args.hour > 17) return false;
      if(args.minute != 0 && args.minute != 30) return false;
      // no such doctor id
      if(d == null) return false;
      // doctor is not available this time
      for(var j = 0; j < d.calendar.length; j++){
        if(d.calendar[j].time.hour == args.hour && 
          d.calendar[j].time.minute == args.minute &&
          !d.calendar[j].canceled) return false;
      }
      var appointmentTime = {hour: args.hour, minute: args.minute};
      // add appointment
      var newAppointment = {id:d.calendar.length, doctorID:args.doctorID, 
        time: appointmentTime, canceled:false};
      d.calendar.push(newAppointment);
      appointment.push(newAppointment);
      return true;
    },

    cancelAppointment(parent, args, context, info) {
      var d = doctors.find((cancelAppointment) => cancelAppointment.id === args.id);
      // no such doctor id
      if(d == null) return false;
      
      for(var j = 0; j < d.calendar.length; j++){
        if(d.calendar[j].id == args.appointmentID && !d.calendar[j].canceled) {
          d.calendar[j].canceled = true;
          return true;
        }
      }
      // no appointment can be canceled
      return false;
    },

    updateAppointment(parent, args, context, info) {
      var d = doctors.find((cancelAppointment) => cancelAppointment.id === args.id);
      // no such doctor id
      if(d == null) return false;
      
      for(var j = 0; j < d.calendar.length; j++){
        if(d.calendar[j].id == args.appointmentID) {
          d.calendar[j].patientName = args.patientName;
          return true;
        }
      }
      // no appointment is updated
      return false;
    },  
      
    }, 
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);